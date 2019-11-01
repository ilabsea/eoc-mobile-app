import firebase from 'react-native-firebase'

const analytics = firebase.analytics()

export const setCurrentScreen = async (screenName, screenClass) => {
  await analytics.setCurrentScreen(screenName, screenClass)
  console.log(screenName, screenClass)
}

export const logEvent = async (eventName, params) => {
  await analytics.logEvent(eventName, params)
  console.log(eventName, params)
}