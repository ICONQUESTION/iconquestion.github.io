// ==UserScript==
// @name         bilibiliAutoGetRedpocket
// @namespace    https://iconquestion.github.io/
// @version      1.0
// @description  try to take over the world!
// @author       iconquestion
// @match        https://live.bilibili.com/run
// @icon         https://live.bilibili.com/favicon.ico
// @grant        none
// ==/UserScript==

//最大的问题：异步！！！
var csrf = document.cookie.match(/(?<=bili_jct=).+?(?=;)/)[0];

function getredpocket() {
    var uids = [];
        // 1.轮询各个分区的第1页
    for (var pagenum = 1; pagenum < 14; pagenum++) {
        console.log('正在检查分区：'+pagenum);
        fetch('https://api.live.bilibili.com/xlive/web-interface/v1/second/getList?platform=web&parent_area_id=' + pagenum + '&page=1', {
            method: 'GET',
            headers: {
                'Accept': 'application/json, text/plain, */*',
            }

        }).then(function(res) {
            return res.json();
        }).then(function(jsondata) {
            jsondata.data.list.forEach(function(ele, eleindex) {
                // 2.对所获数据进行处理
                if ((ele.pendant_info[1] && ele.pendant_info[1].content == '红包') || (ele.pendant_info[2] && ele.pendant_info[2].content == '红包')) {

                    // 3.记录符合房间的信息
                    uids.push(ele.uid);

                    console.log('Find Room id: ' + ele.roomid);
                    console.log('  uid: ' + ele.uid);
                    console.log('  titles: ' + ele.title);

                    // 4.发起GET请求，检测红包状态并提取对应的lot_id
                    fetch('https://api.live.bilibili.com/xlive/lottery-interface/v1/lottery/getLotteryInfoWeb?roomid=' + ele.roomid, {
                        method: 'GET',
                        credentials:'include',
                        headers: {
                            'Accept': 'application/json, text/plain, */*',
                            //required
                        }
                    }).then(function(res) {
                        return res.json();
                    }).then(function(jsondata) {
                        sleep(100).then(function(){
                            console.log('Room :'+ele.roomid+'  Status: '+jsondata.data.popularity_red_pocket[0].user_status);
                            //如果没有红包，popularity_red_pocket属性值null；
                            //如果有红包，popularity_red_pocket中会存在lot_id属性，
                            if (jsondata.data.popularity_red_pocket&&jsondata.data.popularity_red_pocket[0].user_status==2) {
                                var lotid = jsondata.data.popularity_red_pocket[0].lot_id;
                                // 5.请求参与红包活动
                                fetch('https://api.live.bilibili.com/xlive/lottery-interface/v1/popularityRedPocket/RedPocketDraw', {
                                    method: 'POST',
                                    credentials: 'include',
                                    headers: {
                                        'Content-Type': 'application/x-www-form-urlencoded',
                                    },
                                    body: 'ruid=' + ele.uid + '&room_id=' + ele.roomid + '&lot_id=' + lotid + '&spm_id=444.8.red_envelope.extract&jump_from=&session_id=&csrf=' + csrf + '&visit_id='
                                }).then(function(res) {
                                    return res.json();
                                }).then(function(jsondata) {
                                    console.log('Target room id: '+ele.roomid+'  Target lot_id: ' + lotid+'  Status: '+jsondata.code+'  StatusText: '+jsondata.message);
                                    sleep(400+Math.random()*100).then(function(){
                                            // 6.移动所有自动关注的up到特定分组内
                                            fetch('https://api.bilibili.com/x/relation/tags/addUsers?cross_domain=true',{
                                            method:'post',
                                            credentials:'include',
                                            headers:{
                                                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                                            },
                                            body:'fids='+ele.uid+'&tagids=443505&csrf='+csrf
                                            }).then(function(res){
                                                return res.json();
                                            }).then(function(jsondata){
                                                console.log('  Moving: '+ele.uid+'  Status: '+jsondata.code+'  StatusText: '+jsondata.message);
                                            })
                                    });
                                
                                })
                            }
                        })

                    })
                }
            })
        })
    }

    var waterdrop=80000+Math.random()*10000;
    console.info('---间隔时间: '+waterdrop+'ms---');
    setTimeout(getredpocket,waterdrop);
}

getredpocket();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}