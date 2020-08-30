const app = getApp()
const db = wx.cloud.database()
const _ = db.command
const pincheCollection = db.collection('pinche')
const userCollection = db.collection('user')
var pageTitleFriend = ''
var pageTitleGroup = ''
var pageTitleSuccess = ''
var pId = ''

Page({
  data: {
    pTime: '',
    pStart: '',
    pEnd: '',
    pMiddle: '',
    pCar: '',
    pCarNo: '',
    pPerson: '',
    pPrice: '',
    pNote: '',
    pNickName: '',
    pPhone:'',
    loading: true,
    pAvatar: '',
    view: 1,
    publishId: '',
    pList: [],
    guestNickname: '',
    guestMobile: '',
    userId: '',
    allId: '',
    userIdIn: false
  },

  onReady() {
    this.setData({
      loading: false
    });
  },

  onLoad: function (options) {
    pId = options.id
  },

  onShow: async function (options) {
    //获取浏览者（拼过车的）昵称和手机号缓存
    this.setData({
      guestNickname: wx.getStorageSync('myNickname'),
      guestMobile: wx.getStorageSync('myPhone')
    })
    //阅读数+1
    pincheCollection.doc(pId).update({
      data: {
        view: _.inc(1)
      }
    })
    //获取浏览者ID
    await wx.cloud.callFunction({
      name: 'getopenid',
      data: {}
    }).then(res => {
      this.setData({
        userId: res.result.openid
      })
      console.log('浏览者ID：', this.data.userId)
    }).catch(err => {})

    pincheCollection.doc(pId).get().then(res => {
      //console.log(res.data.pList)
      this.setData({
        pTime: res.data.pTime,
        pStart: res.data.pStart,
        pEnd: res.data.pEnd,
        pMiddle: res.data.pMiddle.toString(),
        pPerson: res.data.pPerson,
        pPrice: res.data.pPrice,
        pCar: res.data.pCar,
        pCarNo: res.data.pCarNo,
        pNickName: res.data.pNickName,
        view: res.data.view,
        publishId: res.data._openid,
        pList: res.data.pList,
        pPhone: res.data.pPhone
      })
      pageTitleFriend = '顺路拼车 | ' + this.data.pTime + '，从[ ' + this.data.pStart + ' ]到[ ' + this.data.pEnd + ' ]，余' + this.data.pPerson + '座，先到先得~'
      pageTitleGroup = '车找人，' + this.data.pTime + '，' + this.data.pStart + '到' + this.data.pEnd + '，共' + this.data.pPerson + '座，先到先得~'
      pageTitleSuccess = this.data.pTime + '，' + this.data.pStart + '到' + this.data.pEnd + '，' + this.data.pCar + ',车牌' +this.data.pCarNo  
      //console.log(pageTitle)

      let allId = [this.data.publishId]
      console.log('车主ID：', this.data.publishId)
      for (var i = 0; i < this.data.pList.length; ++i) {
        if (this.data.pList[i].openid != '') {
          allId.push(this.data.pList[i].openid)
        }
        console.log('乘客ID：' + (i + 1), this.data.pList[i].openid)
      }
      this.setData({
        allId: allId
      })
      console.log(allId)

      for (var x in allId) {
        if (allId[x] == this.data.userId) {
          this.setData({
            userIdIn: true
          })
          break
        }
      }
      console.log(this.data.userIdIn)

      //获取发布者头像
      userCollection.where({
        _openid: this.data.publishId
      }).limit(1).field({
        avatar: true
      }).get().then(res => {
        this.setData({
          pAvatar: res.data[0].avatar
        })
        console.log(this.data.publishId,this.data.pAvatar)
      })
    })

    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
  },

  onShareAppMessage: function (res) {
    //console.log(pId)
    return {
      title: pageTitleGroup,
      path: '/pages/detail/detail?id=' + pId,
      imageUrl: ''
    }
  },

  onShareTimeline: function (res) {
    //console.log(pId)
    return {
      title: pageTitleFriend,
      path: '/pages/detail/detail',
      query: "id=" + pId,
      imageUrl: ''
    }
  },

  signUp: function (event) {
    var that = this
    if (this.data.guestNickname.trim() == '') {
      this.setData({
        error_guestNickname: '昵称不能为空'
      })
      return false
    } else {
      this.setData({
        error_guestNickname: ''
      })
    }

    if (this.data.guestMobile.trim() == '') {
      this.setData({
        error_guestMobile: '手机不能为空'
      })
      return false
    } else {
      let reg = /^1[3-9]\d{9}$/
      const phonereg = reg.test(this.data.guestMobile)
      if (!phonereg) {
        this.setData({
          error_guestMobile: '手机号不正确'
        })
        return false
      } else {
        this.setData({
          error_guestMobile: ''
        })
      }
    }
    //更新拼车乘客数据
    pincheCollection.doc(pId).update({
        data: {
          pList: _.push({
            each: [{
              "name": this.data.guestNickname,
              "mobile": this.data.guestMobile,
              "openid": this.data.userId
            }],
            position: 0,
            slice: parseInt(this.data.pPerson),
          })
        }
      }).then(
        wx.setStorageSync('myNickname', this.data.guestNickname),
        wx.setStorageSync('myPhone', this.data.guestMobile),
        pincheCollection.doc(pId).get().then(res => {
          that.setData({
            pList: res.data.pList,
            userIdIn:true
          })

          wx.showModal({
            title: '拼车成功，按时赴约！棒棒哒~',
            content: pageTitleSuccess,
            showCancel: false,
            success (res) {
              if (res.confirm) {
                console.log('用户点击确定')
              } 
            }
          })
        })
      )
      .catch(console.error)
  },

  onChangeName: function (event) {
    this.setData({
      guestNickname: event.detail
    })
    //console.log(this.data.guestNickname)
  },
  onBlurName(event) {
    if (this.data.guestNickname.trim() == '') {
      this.setData({
        error_guestNickname: '昵称不能为空'
      })
      return false
    } else {
      this.setData({
        error_guestNickname: ''
      })
    }
  },

  onChangeMobile: function (event) {
    this.setData({
      guestMobile: event.detail
    })
    //console.log(this.data.guestMobile)
  },

  onBlurMobile(event) {
    if (this.data.guestMobile.trim() == '') {
      this.setData({
        error_guestMobile: '手机不能为空'
      })
      return false
    } else {
      let reg = /^1[3-9]\d{9}$/
      const phonereg = reg.test(this.data.guestMobile)
      if (!phonereg) {
        this.setData({
          error_guestMobile: '手机号不正确'
        })
        return false
      } else {
        this.setData({
          error_guestMobile: ''
        })
      }
    }
  },

  callMaster:function(event){
    wx.makePhoneCall({
      phoneNumber: event.currentTarget.dataset.masterphone
    })
  },

})