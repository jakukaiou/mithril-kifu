import * as m from 'mithril';
import * as c from 'classnames';
import * as _ from 'lodash';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import KifuData from './kifudata';

/**
 * エラー処理用クラス
 */
class KifuError implements Error {
    public name = 'KifuError';

    /**
     * コンストラクタ 
     * 
     * @param message: エラー内容
     * 
     */
    constructor(public message: string) {

    }

    toString() {
        return this.name + ': ' + this.message;
    }
}

/**
 * ひとつひとつの駒の表示クラス
 */
class Koma extends ComponentBasic {

    // 駒の持ち主
    private owner;

    // 駒画像のCSSクラス
    private className;

    // 駒の移動可能情報
    private moves;

    // 駒が成っているかどうか
    private isPromote;

    /**
     * コンストラクタ 
     * 
     * @param komaType: 駒の番号
     * @param owner: 駒の持ち主
     * @param komaNum: 駒の個数
     * 
     */
    constructor(komaType: number, owner: number, komaNum: number) {
        super();

        this.className = '';
        
        // komaNumが0でないならcssクラス名を作成
        if(komaType) {
            this.className = SHOGI.Info.getClassName(komaType, owner);
        }


        this.view = (vnode) => {
            return [
                m('div', {class: c('c-koma_piece_base')}, [
                    (komaNum >= 2) ? m('div', {class: c('c-koma_piece_num')}, komaNum) : null, // 持ち駒の個数表示
                    m('div', {class: c('c-koma_piece', this.className)})
                ])
            ];
        };
    }
}

/**
 * 棋譜リストのクラス
 */
class KifuList extends ComponentBasic {

    constructor(kifuData: KifuData, mode: number) {
        super();

        this.view = () => {
            return [
                m('div', {class: c('c-kifu_container')}, [
                    m('div', {class: c('c-kifu_title')}, '棋譜情報'),
                    m('div', {class: c('c-kifu_list')}, [
                        _.map(kifuData.moveArray, (moveInfo, num) => {
                            return [
                                m('div', {class: c('c-kifu_row', (num === kifuData.moveNum) ? 'is-active' : null)},[
                                    m('div',{class: c('c-kifu_move_info')},[
                                        m('div',{class: c('c-kifu_number')}, num + ':'),
                                    ])
                                ])
                            ]
                        })
                    ])
                ])
            ];
        };
    }
}

/**
 * ツールバーのボタンクラス
 */
class ToolButton extends ComponentBasic {

    constructor(faClass: string, onclickFunc: Function, isSmall: boolean) {
        super();

        this.view = () => {
            return [
                m('a', {
                    class: c('button'),
                    onclick: onclickFunc
                }, [
                    m('span', {class: c('icon', (isSmall) ? 'is-small' : null)}, [
                        m('i', {class: c('fa', faClass)})
                    ])
                ]),
            ]; 
        };
    }
}

/**
 * 指し手解説文+画面操作のボタン群のクラス
 */
class KifuToolBar extends ComponentBasic {

    constructor(kifuData: KifuData, mode: number) {
        super();

        this.view = () => {
            return [
                m('div', {class: c('c-tool_comment')}, kifuData.comment),
                m('div', {class: c('c-tool_button')}, [
                    m('div', {class: c('c-tool_button_container')}, [
                        m(new ToolButton('fa-fast-backward', () => {
                            
                        }, true)),
                        m(new ToolButton('fa-chevron-left', () => {

                        }, true)),
                        m(new ToolButton('fa-chevron-right', () => {

                        }, true)),
                        m(new ToolButton('fa-fast-forward', () => {

                        }, true)),
                    ])
                ])
            ];
        };
    }
}

/**
 * 持ち駒の表示クラス 
 */
class Mochigoma extends ComponentBasic {

    // 持ち駒の分割配列
    private handArray: Array<Object>;

    /**
     * コンストラクタ 
     * 
     * @param owner: 駒の持ち主
     * @param hand: 持ち駒の内容
     * 
     */
    constructor(owner: number, hand: Object) {
        super();

        const handClassName = (owner === SHOGI.PLAYER.SENTE) ? 'c-shogiBan_prop_hand' : 'c-shogiBan_oppo_hand';

        this.handArray = SHOGI.Util.objChunk(hand, 4);

        this.view = (vnode) => {
            return [
                m('div', {class: c('c-shogiBan_hand', handClassName)}, [
                    m('div', {class: c('c-shogiBan_hand_pieces')}, [
                        // 持ち駒の描画
                        _.map(this.handArray, (handRow: _.Dictionary<number>) => {
                        return  m('div', {class: c('c-koma_row')}, [
                                    _.map(handRow, (value, key) => {
                                        return m(new Koma(SHOGI.Info.komaAtoi(key), owner, value));
                                    })
                                ]);
                        })
                    ]),
                    m('div', {class: c('c-shogiBan_hand_base')})
                ])
            ];
        };
    }
}

/**
 * 与えられた盤面の表示クラス 
 */
class ShogiBan extends ComponentBasic {

    private board;

    constructor(kifuData: KifuData, mode: number) {
        super();

        this.board = kifuData.board;

        this.view = (vnode) => {
            return [
                // 盤面の描画
                m('div', {class: c('c-shogiBan_koma')}, [
                    m('div', {class: c('c-shogiBan')}, [
                        _.map(this.board, (boardRow: Array<Object>) => {
                        return  m('div', {class: c('c-koma_row')}, [
                                    _.map(boardRow, (koma: Object) => {
                                        return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1));
                                    })
                                ]);
                        })
                    ]),

                    // 持ち駒の描画
                    m('div', {class: c('c-shogiBan_hand_place')}, [
                        m(new Mochigoma(SHOGI.PLAYER.GOTE, kifuData.hands[SHOGI.PLAYER.GOTE])),
                        m(new Mochigoma(SHOGI.PLAYER.SENTE, kifuData.hands[SHOGI.PLAYER.SENTE]))
                    ]),
                ]),
            ];
        };
    }
}

/**
 * 棋譜プレイヤー全体の表示クラス 
 */
export default class KifuApp extends ComponentBasic {

    // 棋譜のデータ
    private kifuData: KifuData;

    // 将棋盤
    private shogiBan: ShogiBan;

    // 棋譜リスト
    private kifuList: KifuList;

    // ツールバー
    private toolbar: KifuToolBar;

    /**
     * コンストラクタ 
     * 
     * @param jkfData: JSONフォーマットの棋譜形式
     * 
     */
    constructor(jkfData: Object, mode: number) {
        super();

        this.kifuData = new KifuData(jkfData, mode);

        // 将棋盤のViewコンポーネントを作成
        this.shogiBan = new ShogiBan(this.kifuData, mode);

        // 棋譜リストのViewコンポーネントを作成
        this.kifuList = new KifuList(this.kifuData, mode);

        // 棋譜プレイヤー操作ツールバーのViewコンポーネントを作成
        this.toolbar = new KifuToolBar(this.kifuData, mode);

        this.view = (vnode) => {
            return [
                m('div', {class: c('c-kifuPlayer')}, [
                    m('div', {class: c('c-kifuPlayer_inner')}, [
                        m('div', {class: c('c-shogiBan')}, [
                            m(this.shogiBan),
                            m('div', {class: c('c-shogiBan_grid')}),
                            m('div', {class: c('c-shogiBan_bg')}, [
                                m('div', {class: c('c-shogiBan_base')})
                            ])
                        ]),
                        m('div', {class: c('c-kifuPlayer_inner2')}, [
                            m(this.toolbar)
                        ])
                    ]),
                    m(this.kifuList)
                ]),
            ];
        };
    }
}
