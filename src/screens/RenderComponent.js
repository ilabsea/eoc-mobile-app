import React from 'react';
import {FlatList, StyleSheet} from 'react-native';
import {Container} from 'native-base';
import EmptyList from './EmptyList';
import {service} from '../services';
import Config from 'react-native-config';

import {iconMapping} from '../config/utils';
import axios from 'axios';
import * as config from '../config/connectionBase';

import ListComponent from '../components/ListComponent';
import NavigateComponent from '../components/NavigateComponent';
import DownloadComponent from '../components/DownloadComponent';
import Reactotron from 'reactotron-react-native';

import {connect} from 'react-redux';
import {setAxiosErrConfig} from '../actions';

class RenderComponent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      page: 1,
      data: [],
    };

    this.loadMore = this.loadMore.bind(this);
    this.renderRow = this.renderRow.bind(this);
    this.handleFetch = this.handleFetch.bind(this);
  }

  componentDidMount() {
    this.handleSearch();
  }

  handleFetch = async q => {
    if (!this.props.isConnected) {
      return false;
    }

    let {page} = this.state;
    let uri = `${config.uri}/${config.sops_path}`;
    let params = {q, page};
    let headers = {Authorization: `bearer ${Config.SERVER_SECRET_KEY_BASE}`};

    try {
      let data = await axios
        .get(uri, {params, headers})
        .then(resp => resp.data)
        .catch(error => Reactotron.log(error));

      if (data.length > 0) {
        this.setState(prev => {
          return {
            data: [...prev.data, ...data],
            page: prev.page + 1,
          };
        });

        this.setState({isFetching: false});
      }
    } catch (error) {
      Reactotron.log(error);
      // axios.request(error.config);
      this.props.setAxiosErrConfig(error.config);
      // service.toastManager.show(error);
    }
  };

  loadMore = () => {
    this.setState({isFetching: true});
    this.handleFetch(this.props.q);
  };

  renderRow = item => {
    let {typeIcon, actionIcon, action, color} = iconMapping(item.model_name);

    const Action =
      action === 'download' ? DownloadComponent : NavigateComponent;
    return (
      <ListComponent
        item={item}
        typeIcon={typeIcon}
        actionIcon={actionIcon}
        color={color}
        actionComponent={<Action item={item} />}
        action={action}
      />
    );
  };

  handleSearch = () => {
    let {q, shouldLoad} = this.props;

    this.setState({page: 1, data: [], isFetching: !!shouldLoad}, () => {
      if (shouldLoad) {
        this.handleFetch(q);
      }
      if (q !== '') {
        service.firebaseManager.logEvent('EVENT_SEARCH', {q});
      }
    });
  };

  render() {
    return (
      <Container>
        <EmptyList {...this.state} />
        {this.state.data.length > 0 ? (
          <FlatList
            data={this.state.data}
            keyExtractor={item => `${item._index}-${item.id.toString()}`}
            onEndReached={this.loadMore}
            onEndReachedThreshold={0.01}
            renderItem={({item}) => this.renderRow(item)}
            contentContainerStyle={styles.list}
          />
        ) : null}
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 20,
  },
});

const mapStateToProps = ({net}) => ({
  isConnected: net.isConnected,
});

const mapDispatchToProps = {setAxiosErrConfig};
export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(RenderComponent);
