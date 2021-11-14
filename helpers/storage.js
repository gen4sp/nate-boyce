import _ from 'lodash'
import storage from 'localforage'
// const storage = window.localStorage
const fieldKey = 'field'

async function saveField(obj) {
  return await storage.setItem(fieldKey, JSON.stringify(obj, null, 4))
}

async function loadField() {
  try {
    const f = await storage.getItem(fieldKey)
    console.log('> ', f)
    return !f || _.isEmpty(f) ? null : JSON.parse(f)
  } catch (e) {
    return null
  }
}

export default {
  saveField,
  loadField
}
