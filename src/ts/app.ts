import * as m from 'mithril';

import '../scss/main.scss';
import Kifu from './kifu';

class KifuApp {
    constructor(jkfData: Object ) {

        window.onload = () => {
            m.route(document.body, '/', {'/': new Kifu(jkfData)});
        };
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
                    {
                        /*
                        'KY':1,
                        'KE':2,
                        'FU':3,
                        'KA':2,
                        'GI':5,
                        */
                    },
                    {
                        /*
                        'HI':1,
                        'FU':2
                        */
                    }
                ]
            },
    }
};

new KifuApp(jkfData);
