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

// 棋譜コンポーネントのステート定義
const STATE = {
    READONLY: 0,       // プレイヤーモードの場合常にこのステート
    NORMAL: 1,
    INPUT: 2,      // 指し手の追加が可能なステート
    TOINPUT: 3,    // 駒の移動先の入力待ちステート
}

/**
 * 表示に関連するプロパティ群を管理するクラス
 */
class ViewData {
    // 反転状態で表示するかどうか
    public reverse: boolean;

    private state: number;

    // 指し手入力開始地点
    private fromPosX: number;
    private fromPosY: number;

    // 指し手入力時の指し手番号
    private fromNum: number;

    constructor(mode: number) {
        this.reverse = false;

        if(mode === SHOGI.MODE.VIEW) {
            this.state = STATE.READONLY;
        }else if(mode === SHOGI.MODE.EDIT) {
            this.state = STATE.NORMAL;
        }else {
            this.state = STATE.NORMAL;
        }

        this.fromPosX = null;
        this.fromPosY = null;
        this.fromNum = 0;
    }

    //TODO: ここでステート管理する？

    // INPUTにスイッチ
    public switchInput(moveNum) {
        if(this.state !== STATE.NORMAL) {
            return;
        }

        this.state = STATE.INPUT;
        this.fromNum = moveNum;
    }

    // TOINPUTにスイッチ
    public switchToInput(x: number = null, y: number = null) {
        if(this.state !== STATE.INPUT) {
            return;
        }

        this.fromPosX = x;
        this.fromPosY = y;
    }

    // NORMALに戻る
    public switchNormal() {
        if(this.state === STATE.READONLY) {
            return;
        }

        this.state = STATE.NORMAL;

        this.fromPosX = null;
        this.fromPosY = null;
        this.fromNum = 0;
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
    constructor(komaType: number, owner: number, komaNum: number, mark: boolean = false) {
        super();

        this.className = '';
        
        // komaNumが0でないならcssクラス名を作成
        // TODO: markがtrueの場合フォーカス処理
        if(komaNum) {
            this.className = SHOGI.Info.getClassName(komaType, owner);
        }


        this.view = (vnode) => {
            return [
                m('div', {class: c('c-koma_piece_base', (mark)? 'is-focus' : null)}, [
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

    private selectDisp: Boolean;

    private selectMoves: {};

    private forkPoint: number;

    constructor(kifuData: KifuData, viewData: ViewData, mode: number) {
        super();

        this.selectDisp = false;
        this.selectMoves = null;
        this.forkPoint = 0;

        this.view = () => {
            return [
                m('div', {class: c('c-kifu_container')}, [
                    m('div', {class: c('c-kifu_title')}, '棋譜情報'),
                    m('div', {class: c('c-kifu_listContainer')}, [
                        m('div', {class: c('c-kifu_list')}, [
                            (mode === SHOGI.MODE.VIEW) ?
                            // 閲覧モード時の棋譜リスト
                            _.map(kifuData.moveArray, (moveInfo, num) => {
                                return [
                                    m('div', {class: c('c-kifu_row', (num === kifuData.moveNum) ? 'is-active' : null)}, [
                                        m('div', {class: c('c-kifu_move_info')}, [
                                            m('div', {class: c('c-kifu_number')}, num + ':'),
                                            m('div', {class: c('c-kifu_move')}, kifuData.getMove(num).moveName),
                                            m('div', {class: c('c-kifu_notation')}, [
                                                (kifuData.getMove(num).comment)?
                                                m('span', {class: c('c-kifu_notation_comment', 'icon', 'is-small')},[
                                                    m('i',{class: c('fa', 'fa-commenting-o')})
                                                ]):null,
                                                (kifuData.getMove(num).fork)?
                                                m('span', 
                                                {
                                                    class: c('c-kifu_notation_branch', 'icon', 'is-small'),
                                                    onclick: () => {
                                                        // 分岐棋譜の表示処理
                                                        this.selectDisp = true;
                                                        this.selectMoves = kifuData.getForkList(num);
                                                        this.forkPoint = num;
                                                    }
                                                },[
                                                    m('i',{class: c('fa', 'fa-clone')})
                                                ])
                                                :null
                                            ])
                                        ])
                                    ])
                                ]
                            })
                            :
                            // 編集モード時の棋譜リスト
                            // TODO: 現在の指し手、分岐指し手表示の一番下、棋譜リストの一番下に指し手追加のボタンを表示する
                            // TODO: 現在の棋譜が定跡か棋譜かをどこかで管理
                            _.map(kifuData.moveArray, (moveInfo, num) => {
                                return [
                                    m('div', {class: c('c-kifu_row', (num === kifuData.moveNum) ? 'is-active' : null)}, [
                                        m('div', {class: c('c-kifu_move_info')}, [
                                            m('div', {class: c('c-kifu_number')}, num + ':'),
                                            m('div', {class: c('c-kifu_move')}, kifuData.getMove(num).moveName),
                                            m('div', {class: c('c-kifu_notation')}, [
                                                ((kifuData.getMove(num).fork) || (num === kifuData.moveNum)) && num != 0 ?
                                                m('span', 
                                                {
                                                    class: c('c-kifu_notation_branch', 'icon', 'is-small'),
                                                    onclick: () => {
                                                        // 分岐棋譜の表示処理
                                                        this.selectDisp = true;
                                                        this.selectMoves = kifuData.getForkList(num);
                                                        this.forkPoint = num;
                                                    }
                                                },[
                                                    m('i',{class: c('fa', 'fa-clone')})
                                                ])
                                                :null,
                                                (num === kifuData.moveNum) && (num === (kifuData.moveArray.length - 1)) ?
                                                m('span', 
                                                {
                                                    class: c('c-kifu_notation_close', 'icon', 'is-small'),
                                                    onclick: () => {
                                                        // TODO:指し手の削除処理
                                                    }
                                                },[
                                                    m('i',{class: c('fa', 'fa-close')})
                                                ])
                                                :null,
                                            ])
                                        ])
                                    ])
                                ]
                            })
                        ]),

                        // 分岐棋譜の選択部分コンポーネント
                        (mode === SHOGI.MODE.VIEW) ?
                        // ビューモードの場合
                        m('div', {class: c('c-kifu_fork', (this.selectDisp) ? 'is-active' : null)}, [
                            m('div', {class: c('c-kifu_select')}, [
                                m('div', {class: c('c-kifu_move_info')}, [
                                    m('div', {class: c('c-kifu_notation')}, [
                                        m('span', 
                                        {
                                            class: c('c-kifu_select_close', 'icon'),
                                            onclick: () => {
                                                this.selectDisp = false;
                                            }
                                        },[
                                            m('i',{class: c('fa', 'fa-close')})
                                        ])
                                    ])
                                ])
                            ]),
                            _.map(this.selectMoves, (moveInfo, num) => {

                                const forkNum : number = +num;

                                return [
                                    m('div', {
                                        class: c('c-kifu_row', 'c-kifu_forkRow'),
                                        onclick: () => {
                                            kifuData.switchFork(this.forkPoint, forkNum);
                                            this.selectDisp = false;
                                        }
                                    }, [
                                        m('div', {class: c('c-kifu_move_info')}, [
                                            m('div', {class: c('c-kifu_number')}, num + ':'),
                                            m('div', {class: c('c-kifu_move')}, kifuData.getForkMove(this.forkPoint, forkNum).moveName),
                                        ])
                                    ])
                                ]
                            })
                        ])
                        :
                        // 編集モードの場合
                        m('div', {class: c('c-kifu_fork', (this.selectDisp) ? 'is-active' : null)}, [
                            m('div', {class: c('c-kifu_select')}, [
                                m('div', {class: c('c-kifu_move_info')}, [
                                    m('div', {class: c('c-kifu_notation')}, [
                                        m('span', 
                                        {
                                            class: c('c-kifu_select_close', 'icon'),
                                            onclick: () => {
                                                this.selectDisp = false;
                                            }
                                        },[
                                            m('i',{class: c('fa', 'fa-close')})
                                        ])
                                    ])
                                ])
                            ]),
                            _.map(this.selectMoves, (moveInfo, num) => {

                                const forkNum : number = +num;

                                return [
                                    m('div', {
                                        class: c('c-kifu_row', 'c-kifu_forkRow'),
                                        onclick: () => {
                                            kifuData.switchFork(this.forkPoint, forkNum);
                                            this.selectDisp = false;
                                        }
                                    }, [
                                        m('div', {class: c('c-kifu_move_info')}, [
                                            m('div', {class: c('c-kifu_number')}, num + ':'),
                                            m('div', {class: c('c-kifu_move')}, kifuData.getForkMove(this.forkPoint, forkNum).moveName),
                                        ])
                                    ])
                                ]
                            }),
                            m('div', {
                                class: c('c-kifu_row', 'c-kifu_addRow'),
                                onclick: () => {
                                    // TODO: 分岐の追加処理
                                    console.log('kifuList', viewData);
                                }
                            }, [
                                m('div', {class: c('c-kifu_move_info')}, [
                                    m('div', {class: c('c-kifu_number')}, 
                                    [
                                        m('span',{class: c('icon', 'is-small')},[
                                            m('i',{class: c('fa', 'fa-plus')})
                                        ]),
                                        ':'
                                    ]),
                                    m('div', {class: c('c-kifu_move')}, '分岐を追加'),
                                ])
                            ])
                        ])
                        ,

                        m('div', {class: c('c-kifu_blackOut', (this.selectDisp) ? 'is-active' : null)}, [

                        ])
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

    constructor(kifuData: KifuData, viewData: ViewData, mode: number) {
        super();

        this.view = () => {
            const targetNum = kifuData.moveNum;

            return [
                m('div', {class: c('c-tool_comment')}, kifuData.getMove(targetNum).comment),
                m('div', {class: c('c-tool_button')}, [
                    m('div', {class: c('c-tool_button_container')}, [
                        m(new ToolButton('fa-fast-backward', () => {
                            kifuData.moveNum = 0;
                            m.redraw();
                        }, true)),
                        m(new ToolButton('fa-chevron-left', () => {
                            // 初期盤面でないときのみ更新処理をかける
                            if(kifuData.moveNum > 0){
                                kifuData.moveNum--;

                                // 通常状態にスイッチ
                                viewData.switchNormal();

                                m.redraw();
                            }
                        }, true)),
                        m(new ToolButton('fa-chevron-right', () => {
                            // 最終盤面でないときのみ更新処理をかける
                            if(kifuData.moveNum < (kifuData.moveArray.length - 1)){
                                kifuData.moveNum++;

                                // 最終盤面になった場合インプットステートにスイッチ
                                if(kifuData.moveNum === (kifuData.moveArray.length - 1)) {
                                    viewData.switchInput(kifuData.moveNum);
                                }else {
                                    viewData.switchNormal();
                                }

                                m.redraw();
                            }
                        }, true)),
                        m(new ToolButton('fa-fast-forward', () => {
                            kifuData.moveNum = (kifuData.moveArray.length - 1);
                            m.redraw();
                        }, true)),
                    ]),
                    m('div', {class: c('c-tool_button_container')}, [
                        m(new ToolButton('fa-street-view', () => {
                            // 盤面の反転処理
                            viewData.reverse = !(viewData.reverse);
                            m.redraw();
                        }, false)),
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

        // 所持数1以上の駒を4つずつ区切って配列にする
        this.handArray = SHOGI.Util.objChunk(
            _.pickBy(hand, (value, key) => {
                return (value)? true : false
            }), 4);

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

    constructor(kifuData: KifuData, viewData: ViewData, mode: number) {
        super();

        this.view = (vnode) => {
            return [
                // 盤面の描画
                m('div', {class: c('c-shogiBan_koma')}, [
                    m('div', {class: c('c-shogiBan')}, [
                        _.map( !(viewData.reverse) ? (kifuData.board) : (kifuData.reverseBoard), (boardRow: Array<Object>, y: number) => {
                        return  m('div', {class: c('c-koma_row')}, [
                                    _.map(boardRow, (koma: Object, x: number) => {
                                        const isFocus = !(viewData.reverse) ? kifuData.isFocus(x, y) : kifuData.isFocus(x, y, true);
                                        if(isFocus){
                                            // focus時はfocusして表示
                                            return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), !(viewData.reverse) ?  koma['color'] : (1 - koma['color']), 1, true));
                                        }
                                        return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), !(viewData.reverse) ?  koma['color'] : (1 - koma['color']), 1));
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

    //表示用プロパティ
    private viewData: ViewData;

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

        // TODO: 編集モードの作成
        // TODO: スクロール時の位置合わせ

        this.kifuData = new KifuData(jkfData, mode);

        this.viewData = new ViewData(mode);

        // 将棋盤のViewコンポーネントを作成
        this.shogiBan = new ShogiBan(this.kifuData, this.viewData, mode);

        // 棋譜リストのViewコンポーネントを作成
        this.kifuList = new KifuList(this.kifuData, this.viewData, mode);

        // 棋譜プレイヤー操作ツールバーのViewコンポーネントを作成
        this.toolbar = new KifuToolBar(this.kifuData, this.viewData, mode);

        this.oncreate = (vnode) => {
            // 初期状態でfocusさせる
            const elm = vnode.dom as HTMLElement;
            elm.focus();
        }

        // 
        this.onupdate = (vnode) => {
            // TODO: input可能状態の解除処理
            console.log('kifuApp_update', this.viewData);
        }

        this.view = (vnode) => {
            return [
                m('div', {
                    class: c('c-kifuPlayer'),
                    tabindex: 1,
                    onkeydown: (e: KeyboardEvent) => {
                        // TODO: 棋譜操作のカーソル処理

                        switch(e.keyCode){
                            case 37:
                                this.kifuData.moveNum--;

                                // 通常ステートにスイッチ
                                this.viewData.switchNormal();
                                break;
                            case 39:
                                this.kifuData.moveNum++;

                                // 最終盤面になった場合インプットステートにスイッチ
                                if(this.kifuData.moveNum === (this.kifuData.moveArray.length - 1)) {
                                    this.viewData.switchInput(this.kifuData.moveNum);
                                }else {
                                    this.viewData.switchNormal();
                                }
                                break;
                        }
                    }
                }, [
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
