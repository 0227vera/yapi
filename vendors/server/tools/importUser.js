/**
 * 用户导入工具，导入excel格式的用户
 */

// let fs = require('fs');
let xlsx = require('node-xlsx').default;
let userModel = require('../models/user.js');
const userData = xlsx.parse(`${__dirname}/users.xlsx`);
const groupModel = require('../models/group.js');
const yapi = require('../yapi.js');
const commons = require('../utils/commons');
yapi.commons = commons;
const dbModule = require('../utils/db.js');
yapi.connect = dbModule.connect();


if (userData && userData.length > 0) {
  let sheet = userData[0].data;
  let flat = function* () {
    for (let i = 0; i < sheet.length; i++) {
      let e = sheet[i]
      if (e[0] !== '用户id') {
        // console.log(e[1], e[2], e[4], e[5])
        let username = e[1];
        let email = e[2];
        let group = e[4];
        let isAdmin = e[5];
        yield addUser(username, email, group, isAdmin)
      }
    }
  }

  run(flat)
}

function checkRepeatFn() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([1])
    }, 3000);
  })
}

async function addUser(username, email, group, isAdmin) {
  // 1) 创建用户
  // 2) 判断用户当前分组是否存在，如果不存在，则创建分组
  // 3) 将用户加入所属分组
  // 4) 判断用户是否是分组管理员
  let userInst = yapi.getInst(userModel)
  let groupInst = yapi.getInst(groupModel)
  let password = 'lzx2019'
  console.log(1)
  // let checkRepeat = await checkRepeatFn(email); //然后检查是否已经存在该用户
  let checkRepeat = await userInst.checkRepeat(email); //然后检查是否已经存在该用户
  if (checkRepeat > 0) {
    console.log(`${email}已经存在`)
  } else {
    let passsalt = commons.randStr();
    let data = {
      username: username,
      password: commons.generatePassword(password, passsalt), //加密
      email: email,
      passsalt: passsalt,
      role: 'member',
      add_time: commons.time(),
      up_time: commons.time(),
      type: 'site'
    };
    let user = await userInst.save(data);
    console.log(`创建用${username}成功`)
    // 创建或者添加group
    let groups = group.split(',');
    for (let i = 0; i < groups.length; i++) {
      await addGroup(groups[i], groupInst, isAdmin, user, username, email)
    }
  }
  return username
}

async function addGroup(group, groupInst, isAdmin, user, username, email) {
  let checkRepeat1 = await groupInst.checkRepeat(group);
  let role = {
    role: isAdmin ? "owner" : "dev",
    uid: user._id,
    username: username,
    email: email
  }
  if (checkRepeat1 === 0) {
    let gdata = {
      group_name: group,
      group_desc: group,
      uid: user._id,
      add_time: yapi.commons.time(),
      up_time: yapi.commons.time(),
      members: [role]
    };
    await groupInst.save(gdata);
    console.log(`分组${group}创建成功，添加用户${username}`)
  } else {
    let add_members = [];
    let gid = await groupInst.getGroupIdByName(group)
    // console.log(checkRepeat1)
    let check = await groupInst.checkMemberRepeat(gid, user._id);
    if (check === 0) {
      add_members.push(role);
      await groupInst.addMember(gid, add_members);
      console.log(`用户${username}被添加到分组${group}`)
    }
  }
}

function save () {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: 1
      })
    }, 1000)
  })
}

function run(gen) {
  var g = gen();

  function next(data) {
    var result = g.next(data);
    if (result.done) return result.value;
    result.value.then(next);
  }

  next();
}