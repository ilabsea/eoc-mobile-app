import React, {Component} from 'react';
import {YellowBox, View, StyleSheet} from 'react-native';

import {H3, Button, Icon} from 'native-base';

import {service} from '../services';
import RenderComponent from './RenderComponent';
import Root from '../components/Root';
import codePush from 'react-native-code-push';

// TOREMV
YellowBox.ignoreWarnings(['Remote debugger', 'Warning', 'Require cycle']);

class HomeScreen extends Component {
  static navigationOptions = ({navigation}) => {
    return {
      headerTitle: () => (
        <View style={styles.headerTitle}>
          <H3 style={styles.headerText}>Guidelines</H3>
          <Button transparent onPress={() => navigation.navigate('Search')}>
            <Icon name="ios-search" style={styles.headerText} />
          </Button>
        </View>
      ),
    };
  };

  constructor(props) {
    super(props);

    this.state = {
      isFetching: true,
      page: 1,
      q: '',
      data: [],
    };
  }

  codePushStatusDidChange(status) {
    switch (status) {
      case codePush.SyncStatus.CHECKING_FOR_UPDATE:
        console.log('Checking for updates.');
        break;
      case codePush.SyncStatus.DOWNLOADING_PACKAGE:
        console.log('Downloading package.');
        break;
      case codePush.SyncStatus.INSTALLING_UPDATE:
        console.log('Installing update.');
        break;
      case codePush.SyncStatus.UP_TO_DATE:
        console.log('Up-to-date.');
        break;
      case codePush.SyncStatus.UPDATE_INSTALLED:
        console.log('Update installed.');
        break;
    }
  }

  codePushDownloadDidProgress(progress) {
    console.log(
      progress.receivedBytes + ' of ' + progress.totalBytes + ' received.',
    );
  }

  componentDidMount() {
    service.firebaseManager.setCurrentScreen('HomeScreen', 'HomeScreen');
  }

  render() {
    return (
      <Root>
        <RenderComponent q="*" shouldLoad={true} />
      </Root>
    );
  }
}

const styles = StyleSheet.create({
  headerTitle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 15,
  },
  headerText: {
    color: '#FFF',
  },
});

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_START,
};
export default codePush(codePushOptions)(HomeScreen);
