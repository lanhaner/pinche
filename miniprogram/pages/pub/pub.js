const app = getApp()
const db = wx.cloud.database()
const pincheCollection = db.collection('pinche')
const userCollection = db.collection('user')

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
    isLogged: '',
    pNickName: '',
    pPhone: '',
    pPhonelock: false,//如果是从数据库里取出，就上锁不让修改
    pList:[]
  },

  onLoad: function (options) {
    this.setData({
      isLogged: wx.getStorageSync('isLogged')
    })
    //console.log('onLoad：', this.data.isLogged)
  },

  onShow: function (options) {
    if (wx.getStorageSync('openid') == '') {
      wx.cloud.callFunction({
        name: 'getopenid',
        data: {}
      }).then(res => {
        wx.setStorageSync('openid', res.result.openid)
      }).catch(err => {})
    }

    let nowDate = new Date()
    nowDate = nowDate.setHours(nowDate.getHours() + 2)
    let tempDate = new Date(nowDate)

    this.setData({
      isLogged: wx.getStorageSync('isLogged'),
      pNickName: wx.getStorageSync('name'),
      myopenid: wx.getStorageSync('openid'),
      pTime: tempDate.getDate() + "日" + (tempDate.getHours()<10?("0" +tempDate.getHours()):tempDate.getHours()) + ":" + (tempDate.getMinutes() < 10 ? ("0" + tempDate.getMinutes()) : tempDate.getMinutes())
    })
    //console.log('onshow：', this.data.isLogged)
    //检查是否授权（昵称、图像）
    if (!this.data.isLogged) {
      wx.showModal({
        title: '提示',
        showCancel: false,
        content: '发布拼车信息需要您微信授权登陆',
        success(res) {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/user/user',
            })
          }
        }
      })
    } else {
      //获取用户已存电话号码
      //console.log("openid:", wx.getStorageSync('openid'))
      userCollection.where({
        _openid: wx.getStorageSync('openid')
      }).get().then(res => {
        //console.log(res.data[0].phone)
        if (res.data[0].phone != '') {
          this.setData({
            pPhone: res.data[0].phone,
            pPhonelock: true
          })
        }
      })
      //获取用户已存车牌信息
      pincheCollection.where({
        _openid: wx.getStorageSync('openid')
      }).limit(1).get().then(res => {
        //console.log(res)
        this.setData({
          pCar: res.data[0].pCar,
          pCarNo: res.data[0].pCarNo,
          pPerson: res.data[0].pPerson,
          pPrice: res.data[0].pPrice,
          pStart: res.data[0].pStart,
          pEnd: res.data[0].pEnd,
          pMiddle: res.data[0].pMiddle.toString(),
          pNote: res.data[0].pNote
        })
      })
    }
  },

  onChangeTime(event) {
    let myTime = event.detail
    myTime = myTime.replace('：', ':')
    this.setData({
      pTime: myTime
    })
    //console.log(this.data.pTime);
  },

  onBlurTime(event) {
    if (this.data.pTime.trim() == '') {
      this.setData({
        error_pTime: '出发时间不能为空'
      })
      return false
    } else {
      let reg = /^((0?[1-9])|((1|2)[0-9])|30|31)\日((0?[0-9])|(1?[0-9])|(2?[0-3]))(\:|\：)(([0][0-9])|([1-5][0-9]))$/
      const timereg = reg.test(this.data.pTime)
      if (!timereg) {
        this.setData({
          error_pTime: '请按示例格式填写：12日09:15'
        })
        return false
      } else {
        this.setData({
          error_pTime: ''
        })
      }
    }
  },

  onChangeStart(event) {
    this.setData({
      pStart: event.detail
    })
  },
  onBlurStart(event) {
    if (this.data.pStart.trim() == '') {
      this.setData({
        error_pStart: '起点位置不能为空'
      })
      return false
    } else {
      this.setData({
        error_pStart: ''
      })
    }
  },

  onChangeEnd(event) {
    this.setData({
      pEnd: event.detail
    })
  },
  onBlurEnd(event) {
    if (this.data.pEnd.trim() == '') {
      this.setData({
        error_pEnd: '终点位置不能为空'
      })
      return false
    } else {
      this.setData({
        error_pEnd: ''
      })
    }
  },

  onChangeMiddle(event) {
    this.setData({
      pMiddle: event.detail
    })
  },

  onChangeCar(event) {
    this.setData({
      pCar: event.detail
    })
  },
  onBlurCar(event) {
    if (this.data.pCar.trim() == '') {
      this.setData({
        error_pCar: '车辆颜色与品牌不能为空'
      })
      return false
    } else {
      this.setData({
        error_pCar: ''
      })
    }
  },

  onChangeCarNo(event) {
    this.setData({
      pCarNo: event.detail.toUpperCase()
    })
    if(this.data.pCarNo.length == 2){
      this.setData({
        pCarNo: this.data.pCarNo.substring(0,1) + '*'
      })
    }
    if(this.data.pCarNo.length == 3){
      this.setData({
        pCarNo: this.data.pCarNo.substring(0,2) + '*'
      })
    }
    if(this.data.pCarNo.length == 4){
      this.setData({
        pCarNo: this.data.pCarNo.substring(0,3) + '*'
      })
    }
  },
  onBlurCarNo(event) {
    if (this.data.pCarNo.trim() == '') {
      this.setData({
        error_pCarNo: '车牌号码不能为空'
      })
      return false
    } else {
      let reg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]\*{3}[A-HJ-NP-Z0-9]{3}$/
      const careg = reg.test(this.data.pCarNo)
      if (!careg) {
        this.setData({
          error_pCarNo: '请按示例格示填写车牌号'
        })
        return false
      } else {
        this.setData({
          error_pCarNo: ''
        })
      }
    }
  },

  onChangePerson(event) {
    this.setData({
      pPerson: event.detail
    })
  },
  onBlurPerson(event) {
    if (this.data.pPerson.trim() == '') {
      this.setData({
        error_pPerson: '可载人数不能为空'
      })
      return false
    } else if (this.data.pPerson.trim() == '0') {
      this.setData({
        error_pPerson: '可载人数不能为0'
      })
      return false
    } else {
      this.setData({
        error_pPerson: ''
      })
    }
  },

  onChangePrice(event) {
    this.setData({
      pPrice: event.detail
    })
  },
  onBlurPrice(event) {
    if (this.data.pPrice.trim() == '') {
      this.setData({
        error_pPrice: '价格不能为空'
      })
      return false
    } else if (this.data.pPrice.trim() == '0') {
      this.setData({
        error_pPrice: '价格不能为0'
      })
      return false
    } else {
      this.setData({
        error_pPrice: ''
      })
    }
  },

  onChangePhone(event) {
    this.setData({
      pPhone: event.detail
    })
  },
  onBlurPhone(event) {
    if (this.data.pPhone.trim() == '') {
      this.setData({
        error_pPhone: '手机号码不能为空'
      })
      return false
    } else {
      let reg = /^1[3-9]\d{9}$/
      const phonereg = reg.test(this.data.pPhone)
      if (!phonereg) {
        this.setData({
          error_pPhone: '请输入正确手机号'
        })
        return false
      } else {
        this.setData({
          error_pPhone: ''
        })
      }
    }
  },


  onChangeNote(event) {
    this.setData({
      pNote: event.detail
    })
  },

  onSubmit(event) {
    //判断各输入框内容是否满足要求
    if (this.data.pTime.trim() == '') {
      this.setData({
        error_pTime: '出发时间不能为空'
      })
      return false
    } else {
      let reg = /^((0?[1-9])|((1|2)[0-9])|30|31)\日((0?[0-9])|(1?[0-9])|(2?[0-3]))(\:|\：)(([0][0-9])|([1-5][0-9]))$/
      const timereg = reg.test(this.data.pTime)
      if (!timereg) {
        this.setData({
          error_pTime: '请按示例格式填写：12日09:15'
        })
        return false
      } else {
        this.setData({
          error_pTime: ''
        })
      }
    }

    if (this.data.pStart.trim() == '') {
      this.setData({
        error_pStart: '起点位置不能为空'
      })
      return false
    } else {
      this.setData({
        error_pStart: ''
      })
    }

    if (this.data.pEnd.trim() == '') {
      this.setData({
        error_pEnd: '终点位置不能为空'
      })
      return false
    } else {
      this.setData({
        error_pEnd: ''
      })
    }

    if (this.data.pCar.trim() == '') {
      this.setData({
        error_pCar: '车辆颜色与品牌不能为空'
      })
      return false
    } else {
      this.setData({
        error_pCar: ''
      })
    }

    if (this.data.pCarNo.trim() == '') {
      this.setData({
        error_pCarNo: '车牌号码不能为空'
      })
      return false
    } else {
      let reg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领]\*{3}[A-HJ-NP-Z0-9]{3}$/
      const careg = reg.test(this.data.pCarNo)
      if (!careg) {
        this.setData({
          error_pCarNo: '请按示例格示填写车牌号'
        })
        return false
      } else {
        this.setData({
          error_pCarNo: ''
        })
      }
    }

    if (this.data.pPerson.trim() == '') {
      this.setData({
        error_pPerson: '可载人数不能为空'
      })
      return false
    } else if (this.data.pPerson.trim() == '0') {
      this.setData({
        error_pPerson: '可载人数不能为0'
      })
      return false
    } else {
      this.setData({
        error_pPerson: ''
      })
    }

    if (this.data.pPrice.trim() == '') {
      this.setData({
        error_pPrice: '价格不能为空'
      })
      return false
    } else if (this.data.pPrice.trim() == '0') {
      this.setData({
        error_pPrice: '价格不能为0'
      })
      return false
    } else {
      this.setData({
        error_pPrice: ''
      })
    }

    if (this.data.pPhone.trim() == '') {
      this.setData({
        error_pPhone: '手机号码不能为空'
      })
      return false
    } else {
      let reg = /^1[3-9]\d{9}$/
      const phonereg = reg.test(this.data.pPhone)
      if (!phonereg) {
        this.setData({
          error_pPhone: '请输入正确手机号'
        })
        return false
      } else {
        this.setData({
          error_pPhone: ''
        })
      }
    }

    userCollection.where({
        _openid: wx.getStorageSync('openid')
      }).update({
        data: {
          phone: this.data.pPhone
        }
      })
      .then(console.log)
      .catch(console.error)

    //把途径地拆成数组
    let myMiddle = this.data.pMiddle
    console.log(myMiddle)
    myMiddle = myMiddle.replace(/[^\u4e00-\u9fa5\u0030-\u0039\u0061-\u007a\u0041-\u005a]+/g, ',')
    let pMiddle = myMiddle.split(',')

    let tempList = []
    for (var i = 0; i < this.data.pPerson; ++i) {
      tempList.push({"name":"","mobile":"","openid":""})
    }

    //提交信息
    pincheCollection.add({
      data: {
        pTime: this.data.pTime,
        pStart: this.data.pStart,
        pEnd: this.data.pEnd,
        pMiddle: pMiddle,
        pCar: this.data.pCar,
        pCarNo: this.data.pCarNo,
        pPerson: this.data.pPerson,
        pPrice: this.data.pPrice,
        pNote: this.data.pNote,
        pPhone: this.data.pPhone,
        pNickName: this.data.pNickName,
        view:1,
        pInputDate: db.serverDate(),
        pList: tempList
      },
      success: function (res) {
        let myPid = res._id
        wx.showToast({
          title: '信息已提交',
          icon: 'success',
          duration: 2000,
          success: function () {
            wx.hideToast()
            wx.redirectTo({
              url: '/pages/detail/detail?id=' + myPid,
            })
          }
        })
      }
    })

  },

})