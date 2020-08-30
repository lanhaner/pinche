// pages/list/list.js
const app = getApp()
const db = wx.cloud.database()
const pincheCollection = db.collection('pinche')

Page({
  data: {
    pList: []
  },

  onShow: function(options){
    pincheCollection.where({
      _openid: wx.getStorageSync('openid')
    }).orderBy('pInputDate', 'desc').get().then(res => {
      console.log(res.data)
      this.setData({
        pList: res.data
      })
    })
  }

})