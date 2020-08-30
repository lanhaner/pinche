const app = getApp()
const db = wx.cloud.database()
const userCollection = db.collection('user')
var myopenid = ''
var mytotal = 0
Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    name: wx.getStorageSync('name'),
    avatar: wx.getStorageSync('avatar'),
    province: wx.getStorageSync('province'),
    isLogged: wx.getStorageSync('isLogged') == '' ? false : wx.getStorageSync('isLogged')
  },

  onShow: function (e) {
    //console.log(this.data.isLogged)
    // 通过getopenid云函数取到用户openid，在user数据库里查是否有该用户，如无添加至数据库
    wx.cloud.callFunction({
      name: 'getopenid',
      data: {}
    }).then(res => {
      myopenid = res.result.openid
      wx.setStorageSync('openid',myopenid)
      console.log(myopenid)
      userCollection.where({
        _openid: myopenid
      }).count().then(res2 => {
        console.log(res2.total)
        mytotal = res2.total
      })
    }).catch(err => {})
  },

  getUserInfo: function (e) {
    let that = this
    // 获取用户信息
    wx.getSetting({
      success(res) {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            lang: "zh_CN",
            success(res) {
              //console.log("获取用户信息成功", res)
              const mynickName = res.userInfo.nickName
              const myavatarUrl = res.userInfo.avatarUrl
              const myprovince = res.userInfo.province
              const mycity = res.userInfo.city
              const mygender = res.userInfo.gender
              const mycountry = res.userInfo.country
              wx.setStorageSync('name', mynickName)
              wx.setStorageSync('avatar', myavatarUrl)
              wx.setStorageSync('province', myprovince)
              wx.setStorageSync('isLogged', true)
              
              that.setData({
                isLogged: true,
                name: mynickName,
                province: myprovince,
                avatar: myavatarUrl
              })

              if (mytotal == 0) {
                userCollection.add({
                    data: {
                      name: mynickName,
                      avatar: myavatarUrl,
                      gender: mygender,
                      country: mycountry,
                      province: myprovince,
                      city: mycity,
                      phone: '',
                      inputdate: db.serverDate()
                    }
                  })
                  .then(res3 => {
                    console.log(res3)
                  })
                  .catch(console.error)
              }
              // console.log(mytotal)
            },
            fail(res) {
              that.setData({
                isLogged: false
              })
              console.log("获取用户信息失败", res)
            }
          })
        } else {
          console.log("未授权=====")
          wx.setStorageSync('isLogged', false)
          that.setData({
            isLogged: false
          })
        }
      }
    })
  },


})