import * as m from 'mithril';
import * as firebase from 'firebase';
import FirebaseManager from './firebaseManager';

import '../scss/main.scss';
import KifuApp from './kifuApp';
import * as SHOGI from './shogi';

import BoardTop from './top';
import BoardCreate from './create';
import BoardView from './view';
import BoardEdit from './edit';
import BoardSearch from './search';
import BoardPostList from './postList';
import BoardStarList from './starList';

import UserInit from './userInit';

class BoardApp {
    constructor(jkfData: Object, mode: number) {
        //m.route(document.body, '/', {'/': new KifuApp(jkfData, mode)});

        //m.route.prefix('');
        m.route(document.body, '/', {
            '/'             : new BoardTop(),
            '/init'         : new UserInit(),
            '/create'       : new BoardCreate(),
            '/view/:id'     : new BoardView(),
            '/edit/:id'     : new BoardEdit(),
            '/posts'        : new BoardPostList(),
            '/stars'        : new BoardStarList(),
            '/search/:word' : new BoardSearch(),
        });
    }
}

// jsonフォーマットのjkf形式による棋譜データ
const jkfData = {
    header: {
        proponent_name:  '先手善治',
        opponent_name: '後手魔太郎',
        title: 'テスト棋譜',
        place: '畳',
        start_time: '2003/05/03 10:30:00',
        end_time:   '2003/05/03 10:30:00',
        limit_time: '00:25+00',
        style:      'YAGURA',
    },
    initial: {
        'preset': 'OTHER',
        'data': {
            // 初期配置
            board: [
                [{color: 1, kind : 'KY'}, {color: 1, kind : 'KE'}, {color: 1, kind : 'GI'}, {color: 1, kind : 'KI'}, {color: 1, kind : 'OU'}, {color: 1, kind : 'KI'}, {color: 1, kind : 'GI'}, {color: 1, kind : 'KE'}, {color: 1, kind : 'KY'}],
                [{                     }, {color: 1, kind : 'HI'}, {                     }, {                     }, {                     }, {                     }, {                     }, {color: 1, kind : 'KA'}, {                     }],
                [{color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}, {color: 1, kind : 'FU'}],
                [{                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }],
                [{                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }],
                [{                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }, {                     }],
                [{color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}, {color: 0, kind : 'FU'}],
                [{                     }, {color: 0, kind : 'KA'}, {                     }, {                     }, {                     }, {                     }, {                     }, {color: 0, kind : 'HI'}, {                     }],
                [{color: 0, kind : 'KY'}, {color: 0, kind : 'KE'}, {color: 0, kind : 'GI'}, {color: 0, kind : 'KI'}, {color: 0, kind : 'OU'}, {color: 0, kind : 'KI'}, {color: 0, kind : 'GI'}, {color: 0, kind : 'KE'}, {color: 0, kind : 'KY'}]
            ],
            // 0なら先手、それ以外なら後手
            color:  0,

            // hands[0]は先手の持ち駒、hands[1]は後手の持ち駒
            hands: [
                {},
                {}
            ]
        },

        'mode' : 'JOSEKI' // 独自定義 棋譜か定跡かを表す 'KIFU' または 'JOSEKI'
    },
    moves: [
        {comments: ['分岐の例']},
        {move: {from: {x: 7, y: 7}, to: {x: 7, y: 6}, color: 0, piece: 'FU'}},
        {move: {from: {x: 3, y: 3}, to: {x: 3, y: 4}, color: 1, piece: 'FU'}, comments: ['次の手で二種類が考えられる：７七桂か２二角成である．', '２二角成を選ぶと筋違い角となる．']},
        {move: {from: {x: 8, y: 9}, to: {x: 7, y: 7}, color: 0, piece: 'KE'}, 'forks': [
            [
                {move: {from: {x: 8, y: 8}, to: {x: 2, y: 2}, color: 0, piece: 'KA', capture: 'KA', promote: false}},
                {move: {from: {x: 3, y: 1}, to: {x: 2, y: 2}, color: 1, piece: 'GI', capture: 'KA', same: true}},
                {move: {to: {x: 4, y: 5}, color: 0, piece: 'KA'},'forks': [
                    [
                        {move: {from: {x: 2, y: 7}, to: {x: 2, y: 6}, color: 0, piece: 'FU'}},
                        {move: {from: {x: 9, y: 3}, to: {x: 9, y: 4}, color: 1, piece: 'FU'}, 'forks':[
                            [
                                {move: {from: {x: 1, y: 3}, to: {x: 1, y: 4}, color: 1, piece: 'FU'}}
                            ]
                        ]}
                    ]
                ]},
                {move: {from: {x: 9, y: 3}, to: {x: 9, y: 4}, color: 1, piece: 'FU'}}
            ]
        ]},
        {move: {from: {x: 2, y: 2}, to: {x: 7, y: 7}, color: 1, piece: 'KA', capture: 'KE', promote: true, same: true}},
        {move: {from: {x: 8, y: 8}, to: {x: 7, y: 7}, color: 0, piece: 'KA', capture: 'UM', same: true}},
        {move: {to: {x: 3, y: 3}, color: 1, piece: 'KE', relative: 'H'}}
    ]
};

// jkfDataのログイン、ロード処理
/*
const fbmanager = FirebaseManager.sharedManager;
//fbmanager.login();
fbmanager.anonymusLogin();


fbmanager.kifuLoad(1).then((json) =>{
    console.log('oh kifu loaded');

    m.route(document.body, '/', {'/': new KifuApp(json, SHOGI.MODE.EDIT)});
})
*/

window.onload = () => {
    // 閲覧モード
    // new KifuControlApp(jkfData, SHOGI.MODE.VIEW);

    // 編集モード
    new BoardApp({}, SHOGI.MODE.EDIT);
    // new KifuControlApp(jkfData, SHOGI.MODE.EDIT);


    // 新規作成モード
    //m.route(document.body, '/', {'/': new KifuApp(jkfData, SHOGI.MODE.EDIT)});
};


