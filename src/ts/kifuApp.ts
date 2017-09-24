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
    //FORKINPUT: 3,
    TOINPUT: 3,    // 駒の移動先の入力待ちステート
    NARIINPUT: 4,  // 成、不成の選択待ちステート
}

// 盤面上の駒への背景色定義
const MARK = {
    NONE: 0,
    RED: 1,
    GREEN: 2,
    BLUE: 3,
    YELLOW: 4
}

// 追加する指し手の種類定義
const ADDTYPE = {
    NORMAL: 0,
    FORK: 1
}

/**
 * 表示に関連するプロパティ群を管理するクラス
 */
class ViewData {
    // 反転状態で表示するかどうか
    public reverse: boolean;

    // コンポーネントのステート
    public state: number;

    // 指し手入力開始地点
    public fromX: number;
    public fromY: number;

    // 指し手入力開始地点の駒番号
    public fromKomaType: number;

    // 成、不成選択地点
    public nariX: number;
    public nariY: number;

    // 指し手入力時の指し手番号
    public fromNum: number;

    // 指し手入力時の次の行動プレイヤー
    public movePlayer: number;

    // 分岐ウインドウを開いているかどうか
    public openFork: boolean;

    // 追加する指し手が通常のものか分岐のものか
    public addtype: number;

    constructor(mode: number) {
        this.reverse = false;

        if(mode === SHOGI.MODE.VIEW) {
            this.state = STATE.READONLY;
        }else if(mode === SHOGI.MODE.EDIT) {
            this.state = STATE.NORMAL;
        }else {
            this.state = STATE.NORMAL;
        }

        this.fromX = null;
        this.fromY = null;

        this.fromNum = 0;

        this.movePlayer = SHOGI.PLAYER.SENTE;

        this.openFork = false;
    }

    // INPUTにスイッチ
    public switchInput(moveNum, movePlayer, addType: number = ADDTYPE.NORMAL) {
        if(this.state !== STATE.NORMAL && this.state !== STATE.INPUT && this.state !== STATE.TOINPUT && this.state !== STATE.NARIINPUT) {
            return;
        }

        this.state = STATE.INPUT;
        this.fromNum = moveNum;
        this.movePlayer = movePlayer;

        this.addtype = addType;

        console.log('INPUT');
    }

    // TOINPUTにスイッチ
    public switchToInput(komaType: number, x: number = null, y: number = null) {
        if(this.state !== STATE.INPUT) {
            return;
        }

        this.state = STATE.TOINPUT;

        this.fromX = (_.isNumber(x)) ? ((this.reverse) ? (8 - x) : x) : null;
        this.fromY = (_.isNumber(y)) ? ((this.reverse) ? (8 - y) : y) : null;

        this.fromKomaType = komaType;



        console.log('TOINPUT');
    }

    // NARIINPUTにスイッチ
    public switchNariInput(x: number = null, y: number = null) {
        if(this.state !== STATE.TOINPUT) {
            return;
        }

        this.state = STATE.NARIINPUT;
        this.nariX = x;
        this.nariY = y;

        console.log('NARIINPUT');
    }

    // NORMALに戻る
    public switchNormal() {
        this.reset();
        if(this.state === STATE.READONLY) {
            return;
        }

        this.state = STATE.NORMAL;

        console.log('NORMAL');
    }

    // デフォルトの状態にプロパティをリセット
    public reset() {
        this.fromX = null;
        this.fromY = null;
        this.fromNum = 0;

        this.openFork = false;
        this.addtype = ADDTYPE.NORMAL;
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


    /**
     * コンストラクタ 
     * 
     * @param komaType: 駒の番号
     * @param owner: 駒の持ち主
     * @param komaNum: 駒の個数
     * 
     */
    constructor(komaType: number, owner: number, komaNum: number, viewData: ViewData, kifuData: KifuData, x: number, y: number, mark: number = MARK.NONE, selectPromote: boolean = false) {
        super();

        this.className = '';
        
        // komaNumが0でないならcssクラス名を作成
        // TODO: markがtrueの場合フォーカス処理
        if(komaNum) {
            this.className = SHOGI.Info.getClassName(komaType, owner, viewData.reverse);
        }

        this.view = (vnode) => {
            return [
                m('div', {
                    class: c('c-koma_piece_base', 
                        (mark === MARK.RED)? 'is-red' : null,
                        (mark === MARK.GREEN)? 'is-green' : null,
                        (mark === MARK.BLUE)? 'is-blue' : null,
                        (mark === MARK.YELLOW)? 'is-yellow' : null,
                    ),
                    onclick: () => {
                        // 新規指し手入力状態の場合移動する駒を選択できる
                        if(viewData.state === STATE.INPUT) {
                            if(owner === viewData.movePlayer) {
                                viewData.switchToInput(komaType, x, y);
                            }
                        
                        // 移動先入力状態の場合移動先を選択できる
                        }else if(viewData.state === STATE.TOINPUT) {
                            if(mark === MARK.RED) {
                                let promotable :boolean = false;

                                // 盤面からの移動の場合のみpromotable判定
                                if(_.isNumber(viewData.fromX) && _.isNumber(viewData.fromY)) {
                                    promotable = (viewData.reverse) ? kifuData.isPromotable(viewData.fromKomaType, 8 - viewData.fromX, 8 - viewData.fromY, 8 - x, 8 - y, viewData.movePlayer) : kifuData.isPromotable(viewData.fromKomaType, viewData.fromX, viewData.fromY, x, y, viewData.movePlayer); 
                                }

                                if(promotable){
                                    viewData.switchNariInput(x, y);
                                }else{
                                    // 指し手を作成
                                    // ステートをノーマルに戻す

                                    const fork = (viewData.addtype === ADDTYPE.FORK) ? true : false;
                                    const toX = (viewData.reverse) ? (8 - x) : x;
                                    const toY = (viewData.reverse) ? (8 - y) : y;
                                    kifuData.moveAdd(viewData.fromKomaType, viewData.fromX, viewData.fromY, toX, toY, false, fork);
                                    // 分岐入力の場合手をひとつ戻っているので元の状態に戻す
                                    if(viewData.addtype == ADDTYPE.FORK) {
                                        kifuData.moveNum ++;
                                    }
                                    viewData.reset();
                                    viewData.switchInput(kifuData.moveNum, kifuData.color, ADDTYPE.NORMAL);
                                    console.log('指し手新規作成');
                                }
                            }else if(owner === viewData.movePlayer){
                                viewData.switchInput(viewData.fromNum, viewData.movePlayer,viewData.addtype);
                                viewData.switchToInput(komaType, x, y);
                            }else {
                                viewData.switchInput(viewData.fromNum, viewData.movePlayer,viewData.addtype);
                            }

                        
                        }
                    }
                }, [
                    (selectPromote) ?
                    m('div', {
                        class: c('c-koma_nari_container')}, [
                        m('div', {
                            class: c('c-koma_nari_button', 'is-nari'),
                            onclick: (e:MouseEvent) => {
                                // 成り入力状態の場合成・不成を選択できる
                                if(viewData.state === STATE.NARIINPUT) {
                                    // 成り駒で新規指し手作成

                                    const fork = (viewData.addtype === ADDTYPE.FORK) ? true : false;
                                    const toX = (viewData.reverse) ? (8 - x) : x;
                                    const toY = (viewData.reverse) ? (8 - y) : y;
                                    kifuData.moveAdd(viewData.fromKomaType, viewData.fromX, viewData.fromY, toX, toY, true, fork);
                                    // 分岐入力の場合手をひとつ戻っているので元の状態に戻す
                                    if(viewData.addtype == ADDTYPE.FORK) {
                                        kifuData.moveNum ++;
                                    }
                                    viewData.reset();
                                    viewData.switchInput(kifuData.moveNum, kifuData.color, ADDTYPE.NORMAL);

                                    console.log('成・指し手新規作成');
                                }

                                e.stopPropagation();
                            }
                        }, '成'),
                        m('div', {
                            class: c('c-koma_nari_button', 'is-funari'),
                            onclick: (e:MouseEvent) => {
                                // 成り入力状態の場合成・不成を選択できる
                                if(viewData.state === STATE.NARIINPUT) {
                                    // 成らずに新規指し手作成

                                    const fork = (viewData.addtype === ADDTYPE.FORK) ? true : false;
                                    const toX = (viewData.reverse) ? (8 - x) : x;
                                    const toY = (viewData.reverse) ? (8 - y) : y;
                                    kifuData.moveAdd(viewData.fromKomaType, viewData.fromX, viewData.fromY, toX, toY, false, fork);
                                    // 分岐入力の場合手をひとつ戻っているので元の状態に戻す
                                    if(viewData.addtype == ADDTYPE.FORK) {
                                        kifuData.moveNum ++;
                                    }
                                    viewData.reset();
                                    viewData.switchInput(kifuData.moveNum, kifuData.color, ADDTYPE.NORMAL);

                                    console.log('不成・指し手新規作成');
                                }

                                e.stopPropagation();
                            }
                        }, '不成')
                    ])
                    :
                    null
                    ,
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

    // 分岐を表示するかどうか

    private selectMoves: {};

    private forkPoint: number;

    constructor(kifuData: KifuData, viewData: ViewData, mode: number) {
        super();

        this.selectMoves = null;
        this.forkPoint = 0;


        this.view = () => {
            return [
                m('div', {class: c('c-kifu_container')}, [
                    m('div', {class: c('c-kifu_title')}, '棋譜情報'),
                    m('div', {class: c('c-kifu_listContainer')}, [
                        m('div', {
                            class: c('c-kifu_list'),
                            onupdate: (vnode: m.VnodeDOM<{}, {}>) => {
                                const listHeight: number = (vnode.dom.childElementCount *　24);
                                const targetHeight: number = (kifuData.moveNum * 24);
                                
                                // スクロール位置の調整
                                vnode.dom.scrollTop = (targetHeight - 480);
                            }
                        }, [
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
                                                        console.log('分岐棋譜を表示');
                                                        viewData.openFork = true;
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
                                                        viewData.openFork = true;
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

                                                        kifuData.moveDelete();
                                                        viewData.switchInput(kifuData.moveNum, kifuData.color);
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

                        // 分岐棋譜の選択コンポーネント
                        (mode === SHOGI.MODE.VIEW) ?
                        // ビューモードの場合
                        m('div', {class: c('c-kifu_fork', (viewData.openFork) ? 'is-active' : null)}, [
                            m('div', {class: c('c-kifu_select')}, [
                                m('div', {class: c('c-kifu_move_info')}, [
                                    m('div', {class: c('c-kifu_notation')}, [
                                        m('span', 
                                        {
                                            class: c('c-kifu_select_close', 'icon'),
                                            onclick: () => {
                                                viewData.openFork = false;
                                            }
                                        },[
                                            m('i',{class: c('fa', 'fa-close')})
                                        ])
                                    ])
                                ])
                            ]),
                            _.map(this.selectMoves, (moveInfo, num) => {

                                const forkNum: number = +num;
                                const isActive: boolean = (kifuData.getFork(this.forkPoint) === forkNum)? true : false;

                                return [
                                    m('div', {
                                        class: c('c-kifu_row', 'c-kifu_forkRow',(isActive) ? 'is-stream' : null),
                                        onclick: () => {
                                            kifuData.switchFork(this.forkPoint, forkNum);
                                            viewData.openFork = false;
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
                        m('div', {class: c('c-kifu_fork', (viewData.openFork) ? 'is-active' : null)}, [
                            m('div', {class: c('c-kifu_select')}, [
                                m('div', {class: c('c-kifu_move_info')}, [
                                    ((viewData.state === STATE.INPUT || viewData.state === STATE.TOINPUT || viewData.state === STATE.NARIINPUT) && viewData.addtype === ADDTYPE.FORK) ?
                                    // 分岐棋譜入力時は戻るボタン
                                    m('div', {class: c('c-kifu_notation')}, [
                                        m('span', 
                                        {
                                            class: c('c-kifu_select_close', 'icon'),
                                            onclick: () => {
                                                console.log('分岐入力から戻る');
                                                kifuData.moveNum++;

                                                // ステートを元に戻す
                                                if(kifuData.moveNum === (kifuData.moveArray.length - 1)) {
                                                    viewData.switchInput(kifuData.moveNum, kifuData.color, ADDTYPE.NORMAL);
                                                }else {
                                                    viewData.switchNormal();
                                                }
                                            }
                                        },[
                                            m('i',{class: c('fa', 'fa-arrow-circle-o-left')})
                                        ])
                                    ])
                                    :
                                    // 通常の棋譜分岐表示時は閉じるボタン
                                    m('div', {class: c('c-kifu_notation')}, [
                                        m('span', 
                                        {
                                            class: c('c-kifu_select_close', 'icon'),
                                            onclick: () => {
                                                viewData.openFork = false;
                                            }
                                        },[
                                            m('i',{class: c('fa', 'fa-close')})
                                        ])
                                    ])
                                ])
                            ]),
                            _.map(this.selectMoves, (moveInfo, num) => {
                                const forkNum : number = +num;
                                const isActive: boolean = (kifuData.getFork(this.forkPoint) === forkNum)? true : false;

                                return [
                                    m('div', {
                                        class: c('c-kifu_row', 'c-kifu_forkRow', (isActive) ? 'is-stream' : null),
                                        onclick: () => {
                                            kifuData.switchFork(this.forkPoint, forkNum);
                                            viewData.openFork = false;
                                        }
                                    }, [
                                        m('div', {class: c('c-kifu_move_info')}, [
                                            m('div', {class: c('c-kifu_number')}, num + ':'),
                                            m('div', {class: c('c-kifu_move')}, kifuData.getForkMove(this.forkPoint, forkNum).moveName),
                                            (forkNum !== 0 && kifuData.getFork(this.forkPoint) !== forkNum) ?
                                            m('div', {class: c('c-kifu_notation')}, [
                                                m('span', 
                                                    {
                                                        class: c('c-kifu_notation_close', 'icon', 'is-small'),
                                                        onclick: (e: MouseEvent) => {
                                                            // TODO:分岐の削除処理
                                                            kifuData.deleteFork(this.forkPoint, forkNum);
                                                            this.selectMoves = kifuData.getForkList(this.forkPoint);
                                                            e.stopPropagation();
                                                        }
                                                    },[
                                                        m('i',{class: c('fa', 'fa-close')})
                                                    ])
                                            ])
                                            :
                                            null
                                        ])
                                    ])
                                ]
                            }),
                            (this.forkPoint === (kifuData.moveNum) || (this.forkPoint === (kifuData.moveNum + 1) && viewData.addtype === ADDTYPE.FORK)) ?
                            m('div', {
                                class: c('c-kifu_row', 'c-kifu_addRow'),
                                onclick: () => {
                                    // 分岐追加対象の盤面に戻る
                                    kifuData.moveNum　--;
                                    viewData.switchInput(kifuData.moveNum, kifuData.color, ADDTYPE.FORK);
                                }
                            }, [
                                m('div', {class: c('c-kifu_move_info')}, [
                                    m('div', {class: c('c-kifu_number')}, 
                                    [
                                        ((viewData.state === STATE.INPUT || viewData.state === STATE.TOINPUT || viewData.state === STATE.NARIINPUT) && viewData.addtype === ADDTYPE.FORK) ?
                                        m('span',{class: c('icon', 'is-small')},[
                                            m('i',{class: c('fa', 'fa-exclamation-circle')})
                                        ])
                                        :
                                        m('span',{class: c('icon', 'is-small')},[
                                            m('i',{class: c('fa', 'fa-plus')})
                                        ]),
                                        ':'
                                    ]),
                                    
                                    ((viewData.state === STATE.INPUT || viewData.state === STATE.TOINPUT || viewData.state === STATE.NARIINPUT) && viewData.addtype === ADDTYPE.FORK) ?
                                    m('div', {class: c('c-kifu_move', 'c-kifu_move_input')}, '分岐を入力して下さい')
                                    :
                                    m('div', {class: c('c-kifu_move')}, '分岐を追加')
                                ])
                            ])
                            :
                            null
                        ])
                        ,

                        m('div', {class: c('c-kifu_blackOut', (viewData.openFork) ? 'is-active' : null)}, [

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

    constructor(faClass: string, onclickFunc: Function, isSmall: boolean, active: boolean = true, blClass: string = null) {
        super();

        this.view = () => {
            return [
                m('a', {
                    class: c('button', blClass),
                    disabled: !(active) ? true : false,
                    onclick: active ? onclickFunc : null
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

        let commentNum = 0;
        let comment = kifuData.getMove(0).comment;

        this.view = () => {
            const targetNum = kifuData.moveNum;
            const playable = (viewData.addtype === ADDTYPE.FORK) ? false : true;

            return [
                (mode === SHOGI.MODE.VIEW) ?
                // 閲覧モードの場合はdivタグ
                m('div', {class: c('c-tool_comment')}, kifuData.getMove(targetNum).comment)
                :
                // 編集モードの場合はtextareaタグ
                m('textarea', {
                    class: c('c-tool_comment'),
                    onupdate: () => {
                        if(commentNum !== targetNum) {
                            commentNum = targetNum;
                            comment = kifuData.getMove(targetNum).comment;
                            console.log('oh update',commentNum, comment);
                        }
                    },
                    value: comment,
                    oninput: m.withAttr('value', (value) =>{
                        comment = value;
                        kifuData.getMove(targetNum).setComment(comment);
                    })
                }),

                (mode === SHOGI.MODE.VIEW) ?
                // 閲覧モード時のボタンリスト
                m('div', {class: c('c-tool_button')}, [
                    m('div', {class: c('c-tool_button_container')}, [
                        m(new ToolButton('fa-fast-backward', () => {
                            kifuData.moveNum = 0;

                            // 通常状態にスイッチ
                            viewData.switchNormal();

                            m.redraw();
                        }, true, playable)),
                        m(new ToolButton('fa-chevron-left', () => {
                            // 初期盤面でないときのみ更新処理をかける
                            if(kifuData.moveNum > 0) {
                                kifuData.moveNum--;

                                // 通常状態にスイッチ
                                viewData.switchNormal();

                                m.redraw();
                            }
                        }, true, playable)),
                        m(new ToolButton('fa-chevron-right', () => {
                            // 最終盤面でないときのみ更新処理をかける
                            if(kifuData.moveNum < (kifuData.moveArray.length - 1)){
                                kifuData.moveNum++;

                                // 最終盤面になった場合インプットステートにスイッチ
                                if(kifuData.moveNum === (kifuData.moveArray.length - 1)) {
                                    viewData.switchInput(kifuData.moveNum, kifuData.color);
                                }else {
                                    viewData.switchNormal();
                                }

                                m.redraw();
                            }
                        }, true, playable)),
                        m(new ToolButton('fa-fast-forward', () => {
                            kifuData.moveNum = (kifuData.moveArray.length - 1);

                            // 最終盤面になるのでインプットステートにスイッチ
                            viewData.switchInput(kifuData.moveNum, kifuData.color);

                            m.redraw();
                        }, true, playable)),
                    ]),
                    m('div', {class: c('c-tool_button_container')}, [
                        m(new ToolButton('fa-street-view', () => {
                            // 盤面の反転処理
                            viewData.reverse = !(viewData.reverse);
                            m.redraw();
                        }, false, true, (viewData.reverse) ? 'is-success': null)),
                    ])
                ])
                :
                // 編集モード時のボタンリスト
                m('div', {class: c('c-tool_button')}, [
                    m('div', {class: c('c-tool_button_container')}, [
                        m(new ToolButton('fa-fast-backward', () => {
                            kifuData.moveNum = 0;

                            // 通常状態にスイッチ
                            viewData.switchNormal();

                            m.redraw();
                        }, true, playable)),
                        m(new ToolButton('fa-chevron-left', () => {
                            // 初期盤面でないときのみ更新処理をかける
                            if(kifuData.moveNum > 0) {
                                kifuData.moveNum--;

                                // 通常状態にスイッチ
                                viewData.switchNormal();

                                m.redraw();
                            }
                        }, true, playable)),
                        m(new ToolButton('fa-chevron-right', () => {
                            // 最終盤面でないときのみ更新処理をかける
                            if(kifuData.moveNum < (kifuData.moveArray.length - 1)){
                                kifuData.moveNum++;

                                // 最終盤面になった場合インプットステートにスイッチ
                                if(kifuData.moveNum === (kifuData.moveArray.length - 1)) {
                                    viewData.switchInput(kifuData.moveNum, kifuData.color);
                                }else {
                                    viewData.switchNormal();
                                }

                                m.redraw();
                            }
                        }, true, playable)),
                        m(new ToolButton('fa-fast-forward', () => {
                            kifuData.moveNum = (kifuData.moveArray.length - 1);

                            // 最終盤面になるのでインプットステートにスイッチ
                            viewData.switchInput(kifuData.moveNum, kifuData.color);

                            m.redraw();
                        }, true, playable)),
                    ]),
                    m('div', {class: c('c-tool_button_container')}, [
                        m(new ToolButton('fa-street-view', () => {
                            // 盤面の反転処理
                            viewData.reverse = !(viewData.reverse);
                            m.redraw();
                        }, false, true, (viewData.reverse) ? 'is-success': null)),
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
     * @param top: 盤面の上側に表示する場合
     * 
     */
    constructor(owner: number, hand: Object, top: boolean, viewData: ViewData, kifuData: KifuData) {
        super();

        const handClassName = (top) ? 'c-shogiBan_oppo_hand' : 'c-shogiBan_prop_hand';

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
                                        if(viewData.state === STATE.INPUT) {
                                            if(owner === kifuData.color) {
                                                return m(new Koma(SHOGI.Info.komaAtoi(key), owner, value, viewData, kifuData, null, null, MARK.BLUE));
                                            }
                                            return m(new Koma(SHOGI.Info.komaAtoi(key), owner, value, viewData, kifuData, null, null));
                                        }else {
                                            return m(new Koma(SHOGI.Info.komaAtoi(key), owner, value, viewData, kifuData, null, null));
                                        }
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

    private area: Array<Array<number>>;

    constructor(kifuData: KifuData, viewData: ViewData, mode: number) {
        super();

        this.area = null;

        this.onbeforeupdate = (vnode, old) => {

            if(viewData.state === STATE.INPUT) {
                this.area = kifuData.makeMovableKomaArea(viewData.reverse);
                return true;
            }

            // toinput状態なら移動エリアを計算する
            if(viewData.state === STATE.TOINPUT) {
                this.area = kifuData.makeMoveArea(viewData.fromX, viewData.fromY, viewData.movePlayer, viewData.fromKomaType, viewData.reverse);
                return true;
            }

        }

        this.view = (vnode) => {
            return [
                // 盤面の描画
                m('div', {class: c('c-shogiBan_koma')}, [
                    m('div', {class: c('c-shogiBan')}, [
                        _.map( !(viewData.reverse) ? (kifuData.board) : (kifuData.reverseBoard), (boardRow: Array<Object>, y: number) => {
                        return  m('div', {class: c('c-koma_row')}, [
                                    _.map(boardRow, (koma: Object, x: number) => {
                                        if(viewData.state === STATE.NORMAL || viewData.state === STATE.READONLY) {
                                            const isFocus = !(viewData.reverse) ? kifuData.isFocus(x, y) : kifuData.isFocus(x, y, true);
                                            if(isFocus){
                                                // focus時はfocusして表示
                                                return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.RED));
                                            }
                                            return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y));
                                        } else if(viewData.state === STATE.TOINPUT) {
                                            if(this.area[y][x]) {
                                                return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.RED));
                                            }
                                            return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y));
                                        }else if(viewData.state === STATE.NARIINPUT){
                                            if(viewData.nariX === x && viewData.nariY === y){
                                                return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.NONE, true));
                                            }
                                            return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y));
                                        }else if(viewData.state === STATE.INPUT) {
                                            if(this.area[y][x]) {
                                                return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.BLUE));
                                            }
                                            return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y));
                                        }else {
                                            return m(new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y));
                                        }
                                    })
                                ]);
                        })
                    ]),

                    // 持ち駒の描画
                    m('div', {class: c('c-shogiBan_hand_place')}, [
                        (viewData.reverse) ?
                        [
                            // 盤面反転時
                            m(new Mochigoma(SHOGI.PLAYER.SENTE, kifuData.hands[SHOGI.PLAYER.SENTE], true, viewData, kifuData)),
                            m(new Mochigoma(SHOGI.PLAYER.GOTE, kifuData.hands[SHOGI.PLAYER.GOTE], false, viewData, kifuData))
                        ]
                        :
                        [
                            // 盤面非反転
                            m(new Mochigoma(SHOGI.PLAYER.GOTE, kifuData.hands[SHOGI.PLAYER.GOTE], true, viewData, kifuData)),
                            m(new Mochigoma(SHOGI.PLAYER.SENTE, kifuData.hands[SHOGI.PLAYER.SENTE], false, viewData, kifuData))
                        ]
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
                                m.redraw();
                                break;
                            case 39:
                                this.kifuData.moveNum++;

                                // 最終盤面になった場合インプットステートにスイッチ
                                if(this.kifuData.moveNum === (this.kifuData.moveArray.length - 1)) {
                                    this.viewData.switchInput(this.kifuData.moveNum, this.kifuData.color);
                                }else {
                                    this.viewData.switchNormal();
                                }
                                m.redraw();
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
