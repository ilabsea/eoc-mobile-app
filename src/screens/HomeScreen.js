import React, { Component } from 'react';
import { StyleSheet, View, YellowBox, Alert } from 'react-native'
import axios from 'axios'
import * as config from '../config/base'
import moment from 'moment'
import { Container, Header, Item, Input, Left, Body, Right, 
          Button, List, ListItem, Text, Icon, H3 } from 'native-base'
import { typeIcon, basename, realname } from '../config/utils'
import { data } from '../data'

import EmptyList from './EmptyList'
import RNBackgroundDownloader from 'react-native-background-downloader'
import RNFS from 'react-native-fs'
import FileViewer from 'react-native-file-viewer'
import VersionNumber from 'react-native-version-number'
import database from '../model/db'



// TOREMV
YellowBox.ignoreWarnings(['Remote debugger'])

class HomeScreen extends Component {
  constructor(props) {
    super(props)

    this.state = {
      appVersion: '0.0.0',
      isFetching: false,
      from: 0,
      size: 15,
      keyword: 'disease',
      data: []
    }

    this.task = null
    this.searchInput = React.createRef()
    this.download = this.download.bind(this)
    this.getAppVer = this.getAppVer.bind(this)
    this.loadMore = this.loadMore.bind(this)
    this.renderRow = this.renderRow.bind(this)
    this.handleFetch = this.handleFetch.bind(this)
    this.handleSearch = this.handleSearch.bind(this)

    // Collection
    this.downloadCollection = database.collections.get('downloads')
  }

  handleListPress = sopGuide => {
    this.props.navigation.navigate({
      routeName: 'SopDetail',
      params: { sopGuide },
    });
  };

  handleFetch = async (keyword) => {
    let { from, size } = this.state
    let uri = `${config.host.staging}:${config.port}/${config.sops_path}`
    let params = { keyword, from, size }

    try {
      let data = await axios.get(uri, { params })
                    .then( resp => resp.data )
                    .catch( error => error)

      if( data.length > 0 ) {
        this.setState( (prev) => {
          return {
            data: [...prev.data, ...data],
            from: prev.from + prev.size
          }
        })
      }
      
      this.setState({isFetching: false})
    } catch ( e ) {
      console.log(e)
    }
  }

  componentDidMount() {
    this.searchInput.current._root.focus()
    this.getAppVer()
    // console.log(this.getDownload())
    // this.download()
  }

  getAppVer = () => {
    this.setState({
      appVersion: VersionNumber.appVersion
    })
  }

  getDownload = async () => {
    const all = await this.downloadCollection.query().fetch()
    console.log(all)
  }

  download = async () => {
    
  }

  loadMore = () => {
    this.setState({isFetching: true})
    this.handleFetch(this.state.keyword)
  }

  handleSearch = () => {
    const { keyword } = this.state

    if( keyword != '' ) {
      this.setState({ from: 0, data: [], isFetching: true }, () => {
        this.handleFetch(keyword)
      })
    }
  }

  highlight = (text, Tag) => {
    let data = []
    words = text.split(/\s/)
    let regex = /class='highlight'>\w+<\/em>/

    words.forEach( (word, index) => {
      if( word == '<em' && regex.test(words[index+1]) ) return

      if( regex.test(word) ) {
        hl = />(\w+)</.exec(word)
        data.push(<Tag key={index} style={styles.searchResult}>{hl[1]}</Tag>)
      } else  {
        data.push(<Tag key={index}>{word}</Tag>)
      }
      data.push(<Text key={index + Date.now()}>{' '}</Text>)
    })

    return data
  }

  _renderSubItem = (esHighlightStr, tag, fallbackComponent) => {
    return esHighlightStr ? this.highlight( esHighlightStr[0], tag ).map( item => item ) : fallbackComponent
  }

  handleDownload(item) {
    // const url = 'http://www.pdf995.com/samples/pdf.pdf'
    // const file = 'pdf.pdf'
    // const localFile = `${RNFS.DocumentDirectoryPath}/${file}`
    
    const url = `${config.host.staging}:${config.port}${item.file.url}`
    const file = basename(url)
    const localFile = `${RNFS.DocumentDirectoryPath}/${file}`

    console.log('handle download', url, file, localFile)

    this.task = RNBackgroundDownloader.download({
      id: file,
      url: url,
      destination: localFile
      }).begin((expectedBytes) => {
          console.log(`Going to download ${expectedBytes} bytes!`);
      }).progress((percent) => {
          console.log(`Downloaded: ${percent * 100}%`);
      }).done(async () => {
        console.log('Download is done! & viewing');
        // FileViewer.open(localFile)

        console.log('local to watermelon')

        const db = await database.action(async () => {
          const newDownload = await this.downloadCollection.create(download => {
            download.remoteUrl = url
            download.localUrl = localFile
            download.name = file
          })
          console.log('created')
        })
      }).error((error) => {
        console.log('Download canceled due to error: ', error);
      });
  }

  renderRow = (item) => {
    let { document_type } = item._source
    let { type, icon, color } = typeIcon(document_type)
    let { name, tags } = item.highlight

    return (
      <ListItem thumbnail>
        <Left>
          <Button transparent style={styles.btnIcon}>
            <Icon type={type} style={{ color, fontSize:42 }} name={ icon } />
          </Button>
        </Left>
        <Body>
          <View>
            <Text>
              { this._renderSubItem(name, H3, <H3>{item._source.name}</H3>) }
            </Text>
            {
              tags ?  <Text> tags: { this._renderSubItem(tags, Text, null) } </Text>  : null
            }

            <View style={{ flexDirection: 'row', alignItems:'center', marginTop: 10 }}>
              <Icon name="md-time" style={{ fontSize: 20, marginRight: 5, color: "#666666" }} />
              <Text style={{color: "#666666"}}>
                { moment(item._source.created_at).fromNow() }
              </Text>
            </View>
          </View>
        </Body>
        <Right>
          {
            document_type == 'document' ?
            <Button rounded 
                    onPress={() => this.handleDownload(item._source)}>
              <Icon name="md-download" /> 
            </Button>
            :
            <Button rounded
                    onPress={() => this.handleListPress(item._source)}>
              <Icon name="arrow-forward" />
            </Button>
          }
        </Right>
      </ListItem>
    );
  }

  render() {
    return (
      <Container>
        <Header searchBar rounded>
          <Item>
            <Icon name="ios-menu" onPress={() => this.props.navigation.openDrawer()} />
            <Input ref={this.searchInput} 
                placeholder="Search"
                value={this.state.keyword}
                onChangeText={(keyword) => this.setState({keyword}) } />
            <Icon name="ios-search" 
                  onPress={ this.handleSearch } />
          </Item>
          <Button transparent>
            <Text>Search</Text>
          </Button>
        </Header>
        {/* <Button full onPress={ this.download }>
          <Text>DL</Text>
        </Button> */}
        <EmptyList {...this.state} />
        <List
          dataArray={this.state.data}
          keyExtractor={item => item._source.id.toString()}
          onEndReached={this.loadMore }
          onEndReachedThreshold={0.5}
          renderRow={ this.renderRow }
        />
      </Container>
    );
  } 
};

const styles = StyleSheet.create({
  btnIcon: { 
    backgroundColor: "#fff", 
    borderWidth: 0
  },
  searchResult: { 
    color: "#4a148c", 
    backgroundColor: "yellow",
    fontWeight: "bold",
  },
});

HomeScreen.navigationOptions = {
  header:null,
  // headerTitle: 'Recent guideline',
  // headerStyle: {
  //   backgroundColor: '#f4511e',
  // },
  // headerTintColor: '#fff',
  // headerRight: <Icon name="md-search" style={styles.icon} />,
};

export default HomeScreen;
