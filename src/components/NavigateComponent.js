import React from 'react'
import { Button, Icon } from 'native-base'
import { service } from '../services'

class NavigateComponent extends React.Component {
  navigate() {
    let { item, navigation } = this.props
    navigation.push('Category', { sopGuide: item, id: item.id }) 
    service.firebaseManager.logEvent('evtNestedNavigation', { id: item.id })
  }

  render() {
    return <Button transparent
                  onPress={() => this.navigate() }>
              <Icon type="MaterialIcons" name="arrow-forward" />
            </Button>
  }
}

export default NavigateComponent