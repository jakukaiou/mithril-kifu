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
    INPUT: 2,          // 指し手の追加が可能なステート
    TOINPUT: 3,        // 駒の移動先の入力待ちステート
    NARIINPUT: 4,      // 成、不成の選択待ちステート
    CREATE: 5,         // 盤面の新規作成ステート
    CUSTOMCREATE: 6,   // カスタム盤面の作成ステート
    EDITSTART: 7,      // 新規作成した盤面の編集開始ステート
    CUSTOMTOINPUT: 8,  // 盤面作成時の駒の配置先の入力待ちステート
    CUSTOMBANEDIT: 9   // 盤面作成時の駒状態編集ステート
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

    // 配置できる駒の情報
    public unsetPieces: Object;

    // 作成中の初期持ち駒
    public createHands: Array<Object>;

    // 作成中の初期盤面
    public createBoard: Array<Array<Object>>;

    // 新規作成の盤面プリセット
    public initBoardPreset: string;

    // 棋譜タイプ
    public kifuType: string;

    constructor(mode: number) {
        this.reverse = false;

        if(mode === SHOGI.MODE.VIEW) {
            this.state = STATE.READONLY;
        }else if(mode === SHOGI.MODE.EDIT) {
            this.state = STATE.NORMAL;
        }else if(mode === SHOGI.MODE.CREATE) {
            this.state = STATE.CREATE;
        }else {
            this.state = STATE.NORMAL;
        }

        this.fromX = null;
        this.fromY = null;

        this.fromNum = 0;

        this.movePlayer = SHOGI.PLAYER.SENTE;

        this.openFork = false;

        this.initBoardPreset = 'HIRATE';

        this.kifuType = 'KIFU';

        if(mode === SHOGI.MODE.CREATE) {
            this.unsetPieces = {
                'FU' : 18,
                'KY' : 4,
                'KE' : 4,
                'GI' : 4,
                'KI' : 4,
                'KA' : 2,
                'HI' : 2,
                'OU' : 2
            };

            this.createBoard = SHOGI.Info.hirateBoard;
            this.createHands = [{},{}];
        }else {
            this.unsetPieces = null;
            this.createBoard = null;
            this.createHands = null;
        }
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

    }

    // NARIINPUTにスイッチ
    public switchNariInput(x: number = null, y: number = null) {
        if(this.state !== STATE.TOINPUT) {
            return;
        }

        this.state = STATE.NARIINPUT;
        this.nariX = x;
        this.nariY = y;
    }

    // CUSTOMCREATEにスイッチ
    public switchCustomCreate(kifuType: string = this.kifuType) {
        if(this.state !== STATE.CREATE && this.state !== STATE.CUSTOMTOINPUT && this.state !== STATE.CUSTOMBANEDIT) {
            return;
        }

        this.state = STATE.CUSTOMCREATE;
        this.kifuType = kifuType;
        this.initBoardPreset = 'OTHER';
    }

    // CUSTOMTOINPUTにスイッチ
    public switchCustomToInput(komaType: number) {
        if(this.state !== STATE.CUSTOMCREATE && this.state !== STATE.CUSTOMTOINPUT) {
            return;
        }

        this.state = STATE.CUSTOMTOINPUT;
        this.fromKomaType = komaType;
    }

    // カスタム初期盤面に配置駒を追加、すでに配置済みの場合その駒を配置駒に戻す
    public setPiece(x: number, y: number) {
        if(this.state !== STATE.CUSTOMTOINPUT) {
            return;
        }

        if(_.has(this.createBoard[y][x], 'kind')) {
            this.switchCustomCreate();
            return;
        }else {
            this.createBoard[y][x] = {kind: SHOGI.Info.komaItoa(this.fromKomaType), color: 0};
            const komaNum = this.deleteHand(this.unsetPieces, SHOGI.Info.komaItoa(this.fromKomaType));

            if(komaNum === 0) {
                this.state = STATE.CUSTOMCREATE;
                this.fromKomaType = null;
            }else {
                this.state = STATE.CUSTOMTOINPUT;
            }
        }
    }

    // カスタム初期盤面の駒を配置駒に戻す
    public unsetPiece(x: number, y: number) {
        if(this.state !== STATE.CUSTOMCREATE) {
            return;
        }

        if(_.has(this.createBoard[y][x], 'kind')) {
            const unsetKoma: string = this.createBoard[y][x]['kind'];
            this.addHand(this.unsetPieces, unsetKoma);

            this.createBoard[y][x] = {};
        }else {
            return;
        }
    }

    // 配置しようとしている駒をキャンセル
    public cancelSetPiece() {
        if(this.state !== STATE.CUSTOMTOINPUT) {
            return;
        }

        this.fromKomaType = null;
    }

    // 盤面編集時の持ち駒追加処理
    public setHand(owner: number) {
        if(this.state !== STATE.CUSTOMTOINPUT) {
            return;
        }

        if(this.fromKomaType === SHOGI.KOMA.OU) {
            return;
        }

        const komaNum = this.deleteHand(this.unsetPieces, SHOGI.Info.komaItoa(this.fromKomaType));
        this.addHand(this.createHands[owner], SHOGI.Info.komaItoa(this.fromKomaType));

        if(komaNum === 0) {
            this.state = STATE.CUSTOMCREATE;
            this.fromKomaType = null;
        }else {
            this.state = STATE.CUSTOMTOINPUT;
        }
    }

    // 持ち駒として追加された駒をUnsetに戻す
    public backUnset(komaType: number, owner: number) {
        if(!_.has(this.createHands[owner], SHOGI.Info.komaItoa(komaType))) {
            return;
        }

        const deleteNum = this.createHands[owner][SHOGI.Info.komaItoa(komaType)];

        for(let i = 0; i<deleteNum; i++){
            this.deleteHand(this.createHands[owner], SHOGI.Info.komaItoa(komaType));
            this.addHand(this.unsetPieces, SHOGI.Info.komaItoa(komaType));
        }

        this.state = STATE.CUSTOMCREATE; 
    }

    // CUSTOMBANEDITにスイッチ
    public switchCustomBanEdit(x: number, y: number) {
        if(this.state !== STATE.CUSTOMCREATE) {
            return;
        }

        this.state = STATE.CUSTOMBANEDIT;
        this.fromX = x;
        this.fromY = y;
    }

    // EDITSTARTにスイッチ
    public switchEditStart(preset: string, kifuType: string) {

        this.state = STATE.EDITSTART;
        this.initBoardPreset = preset;
        this.kifuType = kifuType;
    }

    // NORMALに戻る
    public switchNormal() {
        this.reset();
        if(this.state === STATE.READONLY || this.state == STATE.CREATE) {
            return;
        }

        this.state = STATE.NORMAL;
    }

    // デフォルトの状態にプロパティをリセット
    public reset() {
        this.fromX = null;
        this.fromY = null;
        this.fromNum = 0;

        this.openFork = false;
        this.addtype = ADDTYPE.NORMAL;
    }

    private addHand(addTarget: Object, komaString: string): number {
        const addKoma = (SHOGI.Info.getOrigin(komaString)) ? SHOGI.Info.getOrigin(komaString) : komaString;

        if (_.has(addTarget, addKoma)) {
            return ++addTarget[addKoma];
        } else {
            return addTarget[addKoma] = 1;
        }
    }

    private deleteHand(deleteTarget: Object, komaString: string): number {
        if (_.has(deleteTarget, komaString)) {
            return --deleteTarget[komaString];
        }
    }
}

/**
 * unsetPieces用の駒クラス
 */
class UnsetKoma extends ComponentBasic {
    // 駒の持ち主
    private owner;

    // 駒画像のCSSクラス
    private className;

    private isSetTarget;

    constructor(komaType: number, owner: number, komaNum: number, viewData: ViewData, kifuData: KifuData, mark: number = MARK.NONE) {
        super();

        this.className = '';

        this.isSetTarget = false;
        
        // komaNumが0でないならcssクラス名を作成
        if(komaNum) {
            this.className = SHOGI.Info.getClassName(komaType, owner, viewData.reverse);
        }

        this.view = () => {
            return [
                m('div', {
                    class: c('c-koma_piece_base', 
                        (mark === MARK.RED)? 'is-red' : null,
                        (mark === MARK.GREEN)? 'is-green' : null,
                        (mark === MARK.BLUE)? 'is-blue' : null,
                        (mark === MARK.YELLOW)? 'is-yellow' : null,
                    ),
                    onclick: () => {
                        viewData.switchCustomToInput(komaType);
                    }
                },[
                    (komaNum >= 2) ? m('div', {class: c('c-koma_piece_num')}, komaNum) : null, // 持ち駒の個数表示
                    m('div', {class: c('c-koma_piece', this.className)})
                ])
            ];
        }
    }
}

/**
 * createHands用の駒クラス
 */
class HandEditKoma extends ComponentBasic {
    // 駒の持ち主
    private owner;

    // 駒画像のCSSクラス
    private className;

    // 駒配置時にホバー状態になっているかどうか
    private isHover: boolean;

    constructor(komaType: number, owner: number, komaNum: number, viewData: ViewData, kifuData: KifuData) {
        super();

        this.className = '';
        this.isHover = false;
        
        // komaNumが0でないならcssクラス名を作成
        if(komaNum) {
            this.className = SHOGI.Info.getClassName(komaType, SHOGI.PLAYER.SENTE, viewData.reverse);
        }

        this.view = () => {
            return [
                m('div', {
                    class: c('c-koma_piece_base', 'is-blue'),
                    onclick: () => {
                        console.log('oh koma deleted');
                        viewData.backUnset(komaType,owner);
                    }
                },[
                    (komaNum >= 2) ? m('div', {class: c('c-koma_piece_num')}, komaNum) : null, // 持ち駒の個数表示
                    m('div', {class: c('c-koma_piece', this.className)})
                ])
            ];
        }
    }
}

/**
 * createBoard用の駒クラス
 */
class BanEditKoma extends ComponentBasic {
    // 駒の持ち主
    private owner;

    // 駒画像のCSSクラス
    private className;

    // 配置前の半透明表示状態かどうか
    private isReady: boolean;

    // 駒配置時にホバー状態になっているかどうか
    private isHover: boolean;

    constructor(komaType: number, owner: number, komaNum: number, viewData: ViewData, kifuData: KifuData, x: number, y: number) {
        super();

        this.className = '';

        this.isReady = false;
        this.isHover = false;
        
        // komaNumが0でないならcssクラス名を作成
        if(komaNum) {
            this.className = SHOGI.Info.getClassName(komaType, owner, viewData.reverse);
        }

        const promoted: string = SHOGI.Info.getPromote(viewData.createBoard[y][x]['kind']);
        const origin: string = SHOGI.Info.getOrigin(viewData.createBoard[y][x]['kind']);

        this.view = () => {
            return [
                m('div', {
                    class: c('c-koma_piece_base', 
                        (this.isHover) ? 'is-blue' : null,
                    ),
                    onclick: () => {
                        if(viewData.state === STATE.CUSTOMTOINPUT) {
                            viewData.setPiece(x, y);
                        }else if(viewData.state === STATE.CUSTOMCREATE) {
                            // 駒状態編集モードに移行
                            viewData.switchCustomBanEdit(x, y);
                        }
                    },
                    onmouseover: () => {
                        if(viewData.state === STATE.CUSTOMTOINPUT && this.className === '') {
                            this.className = SHOGI.Info.getClassName(viewData.fromKomaType, 0, viewData.reverse);
                            this.isReady = true;
                        }else if(viewData.state === STATE.CUSTOMCREATE && this.className !== '') {
                            this.isHover = true;
                        }
                    },
                    onmouseout: (event: MouseEvent) => {
                        // 子要素でonmouseoutが起こらないための応急処置
                        let e:Element = event.toElement || event.relatedTarget as Element;
                        if(e) {
                            if(e.classList[0] === 'delete'|| e.classList[0] === 'c-koma_menu_container') {
                                return;
                            }
                        }

                        if(viewData.state === STATE.CUSTOMTOINPUT && this.isReady) {
                            this.className = '';
                            this.isReady = false;
                        }else if(viewData.state === STATE.CUSTOMCREATE) {
                            this.isHover = false;
                        }
                    }
                },[
                    (viewData.state === STATE.CUSTOMBANEDIT && viewData.fromX === x && viewData.fromY === y && this.className !== '') ?
                    m('div', {
                        class: c('c-koma_menu_container')
                    }, [
                        m('div', {
                            class: c('c-koma_half_button', 'is-change'),
                            onclick: (e:MouseEvent) => {
                                // 先手・後手の切り替え  
                                viewData.createBoard[y][x]['color'] = 1 - owner;

                                viewData.switchCustomCreate();
                                e.stopPropagation();
                            }
                        }, (owner === SHOGI.PLAYER.SENTE) ? '後手' : '先手'),
                        m('div', {
                            class: c('c-koma_half_button', 'is-nari'),
                            onclick: (e:MouseEvent) => {
                                // 成り・不成の切り替え
                                if(promoted) {
                                    viewData.createBoard[y][x]['kind'] = promoted;
                                }else if(origin){
                                    viewData.createBoard[y][x]['kind'] = origin;
                                }

                                viewData.switchCustomCreate();
                                e.stopPropagation();
                            }
                        }, 
                            (promoted) ?
                            '成り'
                            :
                            (origin) ? '不成' : '　　'
                        )
                    ])
                    :
                    null,
                    (komaType && this.isHover) ?
                    m('div', {
                        class: c('c-koma_menu_container')
                    }, [
                        m('div', {
                            class: c('delete', 'is-small'),
                            onclick: (e: MouseEvent) => {
                                if(viewData.state === STATE.CUSTOMCREATE){
                                    viewData.unsetPiece(x, y);
                                }

                                e.stopPropagation();
                            }
                        })
                    ])
                    :
                    null,
                    (komaNum >= 2) ? m('div', {class: c('c-koma_piece_num')}, komaNum) : null, // 持ち駒の個数表示
                    m('div', {class: c('c-koma_piece', (this.isReady) ? 'is-ready' : null, this.className)})
                ])
            ];
        }
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
                                    promotable = (viewData.reverse) ? kifuData.isPromotable(viewData.fromKomaType, 8 - viewData.fromX, 8 - viewData.fromY, x, y, 1 - viewData.movePlayer) : kifuData.isPromotable(viewData.fromKomaType, viewData.fromX, viewData.fromY, x, y, viewData.movePlayer); 
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
                                    if(viewData.addtype === ADDTYPE.FORK) {
                                        kifuData.moveNum ++;
                                    }
                                    viewData.reset();
                                    viewData.switchInput(kifuData.moveNum, kifuData.color, ADDTYPE.NORMAL);
                                    m.redraw();
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
                        class: c('c-koma_menu_container')
                    }, [
                        m('div', {
                            class: c('c-koma_half_button', 'is-nari'),
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
                                    m.redraw();
                                    console.log('成・指し手新規作成');
                                }

                                e.stopPropagation();
                            }
                        }, '成'),
                        m('div', {
                            class: c('c-koma_half_button', 'is-funari'),
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
                                    m.redraw();
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
                                    m('div', {
                                        class: c('c-kifu_row', (num === kifuData.moveNum) ? 'is-active' : null),
                                        onclick: () => {
                                            kifuData.moveNum = num;
                                        }
                                    }, [
                                        m('div', {class: c('c-kifu_move_info')}, [
                                            m('div', {class: c('c-kifu_number')}, num + ':'),
                                            // 6文字以上なら小さく表示
                                            m('div', {class: c('c-kifu_move', (kifuData.getMove(num).moveName.length >= 6)? 'is-small': null)}, kifuData.getMove(num).moveName),
                                            m('div', {class: c('c-kifu_notation')}, [
                                                (kifuData.getMove(num).comment)?
                                                m('span', {class: c('c-kifu_notation_comment', 'icon', 'is-small')},[
                                                    m('i',{class: c('fa', 'fa-commenting-o')})
                                                ]):null,
                                                (kifuData.getMove(num).fork) && (kifuData.listmode === SHOGI.LIST.JOSEKI) ?
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
                            null,
                            (mode === SHOGI.MODE.EDIT) ?
                            // 編集モード時の棋譜リスト
                            // TODO: 現在の指し手、分岐指し手表示の一番下、棋譜リストの一番下に指し手追加のボタンを表示する
                            // TODO: 現在の棋譜が定跡か棋譜かをどこかで管理
                            _.map(kifuData.moveArray, (moveInfo, num) => {
                                return [
                                    m('div', {
                                        class: c('c-kifu_row', (num === kifuData.moveNum) ? 'is-active' : null),
                                        onclick: () => {
                                            kifuData.moveNum = num;
                                        }
                                    }, [
                                        m('div', {class: c('c-kifu_move_info')}, [
                                            m('div', {class: c('c-kifu_number')}, num + ':'),
                                            // 6文字以上なら小さく表示
                                            m('div', {class: c('c-kifu_move', (kifuData.getMove(num).moveName.length >= 6)? 'is-small': null)}, kifuData.getMove(num).moveName),
                                            m('div', {class: c('c-kifu_notation')}, [
                                                ((kifuData.getMove(num).fork) || (num === kifuData.moveNum)) && (num != 0) && (kifuData.listmode === SHOGI.LIST.JOSEKI) ?
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
                                                (num === kifuData.moveNum) && (num === (kifuData.moveArray.length - 1)) && (num !== 0) ?
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
                            :
                            null
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
                        null,
                        (mode === SHOGI.MODE.EDIT) ?
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
                        :
                        null
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
                // 閲覧モードの場合のコメント表示はdivタグ
                m('div', {class: c('c-tool_comment')}, kifuData.getMove(targetNum).comment)
                :
                null,

                (mode === SHOGI.MODE.EDIT) ?
                // 編集モードの場合のコメント表示はtextareaタグ
                m('textarea', {
                    class: c('c-tool_comment'),
                    onupdate: () => {
                        if(commentNum !== targetNum) {
                            commentNum = targetNum;
                            comment = kifuData.getMove(targetNum).comment;
                        }
                    },
                    value: comment,
                    oninput: m.withAttr('value', (value) =>{
                        comment = value;
                        kifuData.getMove(targetNum).setComment(comment);
                    })
                })
                :
                null,

                (mode === SHOGI.MODE.CREATE) ?
                // 新規作成モードの場合のコメント表示はdivタグ
                m('div', {class: c('c-tool_comment')}, '初期盤面新規作成')
                :
                null,

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
                null,

                (mode === SHOGI.MODE.EDIT) ?
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
                :
                null,
                (mode === SHOGI.MODE.CREATE) ?
                // 新規作成モード時のボタンリスト
                m('div', {class: c('c-tool_button')}, [
                ])
                :
                null
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
                                        }else if(viewData.state === STATE.CUSTOMCREATE || viewData.state === STATE.CUSTOMTOINPUT || viewData.state === STATE.CUSTOMBANEDIT) {
                                            if(viewData.state === STATE.CUSTOMCREATE){
                                                return m(new UnsetKoma(SHOGI.Info.komaAtoi(key), owner, value, viewData, kifuData, MARK.BLUE));
                                            }else if(viewData.state === STATE.CUSTOMTOINPUT && viewData.fromKomaType === SHOGI.Info.komaAtoi(key)) {
                                                return m(new UnsetKoma(SHOGI.Info.komaAtoi(key), owner, value, viewData, kifuData, MARK.GREEN));
                                            }
                                            return m(new UnsetKoma(SHOGI.Info.komaAtoi(key), owner, value, viewData, kifuData));
                                        }else {
                                            return m(new Koma(SHOGI.Info.komaAtoi(key), owner, value, viewData, kifuData, null, null));
                                        }
                                    })
                                ]);
                        })
                    ]),
                    (viewData.state === STATE.CUSTOMCREATE || viewData.state === STATE.CUSTOMTOINPUT || viewData.state === STATE.CUSTOMBANEDIT) ? 
                    m('div', {class: c('c-shogiBan_hand_pieces', 'is-button')}, [
                        m('div',{
                            class: c('c-shogiBan_createButton'),
                            onclick: () => {
                                console.log('盤面編集完了');

                                viewData.switchEditStart('OTHER', viewData.kifuType);
                            }
                        },[
                            m('div', {
                                class: c('button', 'is-primary')
                            },'盤面編集完了')
                        ])
                    ])
                    :
                    null,
                    m('div', {class: c('c-shogiBan_hand_base')})
                ])
            ];
        };
    }
}

class MochigomaEdit extends ComponentBasic {

    // 先手持ち駒の分割配列
    private propHands: Object;

    // 後手持ち駒の分割配列
    private oppoHands: Object;

    private senteHover: boolean;

    private goteHover: boolean;

    private propHandArray: Array<Object>;
    private propComponents: m.Vnode<any,any>[];

    private oppoHandArray: Array<Object>;
    private oppoComponents: m.Vnode<any,any>[];

    constructor(handArray: Array<Object>, viewData: ViewData, kifuData: KifuData) {
        super();

        this.senteHover = false;
        this.goteHover = false;

        this.propHands = _.cloneDeep(viewData.createHands[SHOGI.PLAYER.SENTE]);

        this.oppoHands = _.cloneDeep(viewData.createHands[SHOGI.PLAYER.GOTE]);

        // 所持数1以上の駒を4つずつ区切って配列にする
        this.propHandArray = SHOGI.Util.objChunk(
            _.pickBy(this.propHands, (value, key) => {
                return (value)? true : false
            }), 4);
        this.propComponents = _.map(this.propHandArray, (handRow: _.Dictionary<number>) => {
                            return  m('div', {class: c('c-koma_row')}, [
                                        _.map(handRow, (value, key) => {
                                            return m(new HandEditKoma(SHOGI.Info.komaAtoi(key), SHOGI.PLAYER.SENTE, value, viewData, kifuData));
                                        })
                                    ]);
                            });
        
        this.oppoHandArray = SHOGI.Util.objChunk(
            _.pickBy(this.oppoHands, (value, key) => {
                return (value)? true : false
            }), 4);
        this.oppoComponents = _.map(this.oppoHandArray, (handRow: _.Dictionary<number>) => {
                            return  m('div', {class: c('c-koma_row')}, [
                                        _.map(handRow, (value, key) => {
                                            return m(new HandEditKoma(SHOGI.Info.komaAtoi(key), SHOGI.PLAYER.GOTE, value, viewData, kifuData));
                                        })
                                    ]);
                            });



        this.view = (vnode) => {
            if(!_.isEqual(viewData.createHands[SHOGI.PLAYER.SENTE], this.propHands)) {
                this.propHands = _.cloneDeep(viewData.createHands[SHOGI.PLAYER.SENTE]);
                this.propHandArray = SHOGI.Util.objChunk(
                _.pickBy(this.propHands, (value, key) => {
                    return (value)? true : false
                }), 4);
                this.propComponents = _.map(this.propHandArray, (handRow: _.Dictionary<number>) => {
                            return  m('div', {class: c('c-koma_row')}, [
                                        _.map(handRow, (value, key) => {
                                            return m(new HandEditKoma(SHOGI.Info.komaAtoi(key), SHOGI.PLAYER.SENTE, value, viewData, kifuData));
                                        })
                                    ]);
                            });
            }

            if(!_.isEqual(viewData.createHands[SHOGI.PLAYER.GOTE], this.oppoHands)) {
                this.oppoHands = _.cloneDeep(viewData.createHands[SHOGI.PLAYER.GOTE]);
                this.oppoHandArray = SHOGI.Util.objChunk(
                _.pickBy(this.oppoHands, (value, key) => {
                    return (value)? true : false
                }), 4);
                this.oppoComponents = _.map(this.oppoHandArray, (handRow: _.Dictionary<number>) => {
                            return  m('div', {class: c('c-koma_row')}, [
                                        _.map(handRow, (value, key) => {
                                            return m(new HandEditKoma(SHOGI.Info.komaAtoi(key), SHOGI.PLAYER.GOTE, value, viewData, kifuData));
                                        })
                                    ]);
                            });
            }

            return [
                m('div', {class: c('c-shogiBan_hand', 'c-shogiBan_oppo_hand')}, [
                    m('div', {
                        class: c('c-shogiBan_hand_pieces', 'is-oppoHands', (this.goteHover) ? 'is-adding' : null),
                        onclick: () => {
                            if(this.goteHover) {
                                viewData.setHand(SHOGI.PLAYER.GOTE);
                            }
                        }
                    }, [ // 持ち駒の描画
                        m('div', {class: c('c-shogiBan_hand_pieces_inner')}, [
                            this.oppoComponents
                        ]),
                        m('div', {
                            class: c('c-shogiBan_hand_owner'),
                            onmouseover: () => {
                                if(viewData.state === STATE.CUSTOMTOINPUT) {
                                    this.goteHover = true;
                                }
                            },
                            onmouseout: () => {
                                this.goteHover = false;
                            }
                        }, 
                        (this.goteHover) ? '持ち駒に追加' : '後手持ち駒'
                        )
                    ]),
                    m('div', {
                        class: c('c-shogiBan_hand_pieces', 'is-propHands', (this.senteHover) ? 'is-adding' : null),
                        onclick: () => {
                            if(this.senteHover) {
                                viewData.setHand(SHOGI.PLAYER.SENTE);
                            }
                        }
                    }, [
                        m('div', {class: c('c-shogiBan_hand_pieces_inner')}, [
                            this.propComponents
                        ]),
                        m('div', {
                            class: c('c-shogiBan_hand_owner'),
                            onmouseover: () => {
                                if(viewData.state === STATE.CUSTOMTOINPUT) {
                                    this.senteHover = true;
                                }
                            },
                            onmouseout: () => {
                                this.senteHover = false;
                            }
                        }, 
                        (this.senteHover) ? '持ち駒に追加' : '先手持ち駒'
                        )
                    ]),
                    m('div', {class: c('c-shogiBan_hand_base')})
                ])
            ]
        }
    }
}

/**
 * 与えられた盤面の表示クラス 
 */
class ShogiBan extends ComponentBasic {
    private viewData: ViewData;
    private kifuData: KifuData;

    private state: number;

    private area: Array<Array<number>>;
    private board: Array<Array<Object>>;
    private boardComponentArray: Array<Array<ComponentBasic>>;

    private mochigomaEdit: ComponentBasic;

    constructor(kifuData: KifuData, viewData: ViewData, mode: number) {
        super();

        this.viewData = viewData;
        this.kifuData = kifuData;

        this.state = viewData.state;

        this.area = null;
        this.board = 
            (viewData.state === STATE.CREATE || viewData.state === STATE.CUSTOMCREATE || viewData.state === STATE.CUSTOMTOINPUT || viewData.state === STATE.CUSTOMBANEDIT) ?
            _.cloneDeep(viewData.createBoard) :
            !(viewData.reverse) ? _.cloneDeep(kifuData.board) : _.cloneDeep(kifuData.reverseBoard);

        this.boardComponentArray = 
        _.map( this.board, (boardRow: Array<Object>, y: number) => {
                return _.map(boardRow, (koma: Object, x: number) => {
                    return _.cloneDeep(this.getKomaComponent(koma, x, y, viewData, kifuData));
                });
        })

        if(mode === SHOGI.MODE.CREATE) {
            this.mochigomaEdit = new MochigomaEdit(viewData.createHands, viewData, kifuData);
        }else {
            this.mochigomaEdit = null;
        }

        // TODO: ここに初期状態でEdit可能な場合の制御を行う？

        this.oninit = () => {
            if(viewData.state === STATE.INPUT) {
                this.area = kifuData.makeMovableKomaArea(viewData.reverse);
            }

            // toinput状態なら移動エリアを計算する
            if(viewData.state === STATE.TOINPUT) {
                this.area = kifuData.makeMoveArea(viewData.fromX, viewData.fromY, viewData.movePlayer, viewData.fromKomaType, viewData.reverse);
            }
        }

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

            const newBoard = 
            (this.viewData.state === STATE.CREATE || this.viewData.state === STATE.CUSTOMCREATE || this.viewData.state === STATE.CUSTOMTOINPUT || this.viewData.state === STATE.CUSTOMBANEDIT) ?
            this.viewData.createBoard :
            !(this.viewData.reverse) ? (this.kifuData.board) : (this.kifuData.reverseBoard);

            this.updateBoardComponent(newBoard);

            return [
                // 盤面の描画
                m('div', {class: c('c-shogiBan_koma')}, [
                    m('div', {class: c('c-shogiBan')}, [
                        _.map( this.boardComponentArray, (boardRow: Array<Object>, y: number) => {
                        return  m('div', {class: c('c-koma_row')}, [
                                    _.map(boardRow, (koma: ComponentBasic, x: number) => {
                                        return m(koma);
                                    })
                                ]);
                        }),
                    ]),

                    // 持ち駒の描画
                    (mode === SHOGI.MODE.VIEW || mode === SHOGI.MODE.EDIT) ?
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
                    ])
                    :
                    null,
                    // 配置駒候補の描画
                    (mode === SHOGI.MODE.CREATE && (viewData.state === STATE.CUSTOMCREATE || viewData.state === STATE.CUSTOMTOINPUT || viewData.state === STATE.CUSTOMBANEDIT)) ?
                    m('div', {class: c('c-shogiBan_hand_place')}, [
                        m(this.mochigomaEdit),
                        m(new Mochigoma(SHOGI.PLAYER.SENTE, viewData.unsetPieces, false, viewData, kifuData)),
                    ])
                    :
                    null,
                ]),
            ];
        };
    }

    private updateBoardComponent(newBoard) {

        const changeState = (this.state !== this.viewData.state) ? true : false;

        _.each( this.board, (boardRow: Array<Object>, y: number) => {
            _.each(boardRow, (koma: Object, x: number) => {
                if(! _.isEqual(this.board[y][x], newBoard[y][x])) {
                    this.board[y][x] = _.cloneDeep(newBoard[y][x]);
                    if(!changeState) {
                        this.boardComponentArray[y][x] = _.cloneDeep(this.getKomaComponent(this.board[y][x], x, y, this.viewData, this.kifuData));
                    }
                }
            })
        })

        /*
        if(changeState) {
            this.state = this.viewData.state;
            _.each( this.board, (boardRow: Array<Object>, y: number) => {
                _.each(boardRow, (koma: Object, x: number) => {
                    this.boardComponentArray[y][x] = _.cloneDeep(this.getKomaComponent(this.board[y][x], x, y, this.viewData, this.kifuData));
                })
            })
        }
        */ 
        // TODO: 駒コンポーネントに対してthis.areaのマーキングを変更するメソッドをつけ、そのメソッドで色替えを行うように変更する

        if(changeState || (this.viewData.state !== STATE.CUSTOMCREATE && this.viewData.state !== STATE.CUSTOMTOINPUT && this.viewData.state !== STATE.CUSTOMBANEDIT)) {
            this.state = this.viewData.state;

            _.each( this.board, (boardRow: Array<Object>, y: number) => {
                _.each(boardRow, (koma: Object, x: number) => {
                    this.boardComponentArray[y][x] = this.getKomaComponent(this.board[y][x], x, y, this.viewData, this.kifuData);
                })
            })
        }   
    }

    private getKomaComponent(koma , x, y, viewData, kifuData): ComponentBasic {
        if(viewData.state === STATE.NORMAL || viewData.state === STATE.READONLY) {
            const isFocus = !(viewData.reverse) ? kifuData.isFocus(x, y) : kifuData.isFocus(x, y, true);
            if(isFocus){
                // focus時はfocusして表示
                return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.RED);
            }
            return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y);
        } else if(viewData.state === STATE.TOINPUT) {
            if(this.area[y][x]) {
                return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.RED);
            }
            return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y);
        }else if(viewData.state === STATE.NARIINPUT){
            if(viewData.nariX === x && viewData.nariY === y){
                return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.NONE, true);
            }
            return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y);
        }else if(viewData.state === STATE.INPUT) {
            if(this.area[y][x]) {
                return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y, MARK.BLUE);
            }
            return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y);
        }else if(viewData.state === STATE.CREATE) {
            return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y);
        }else if(viewData.state === STATE.CUSTOMCREATE || viewData.state === STATE.CUSTOMTOINPUT || viewData.state === STATE.CUSTOMBANEDIT) {
            return new BanEditKoma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y);
        }else {
            return new Koma(SHOGI.Info.komaAtoi(koma['kind']), koma['color'], 1, viewData, kifuData, x, y);
        }
    }
}

/**
 * 新規棋譜作成のコンポーネントクラス
 */
class CreateMenu extends ComponentBasic {
    private viewData: ViewData;
    private kifuData: KifuData;

    private isChecked: boolean;

    private initBoardTypes: Array<string>;
    private komaochiTypes: Array<string>;
    private kifuTypes: Array<string>;

    private initBoardIndex: number;
    private komaochiIndex: number;
    private kifuTypeIndex: number;

    constructor(kifuData: KifuData, viewData: ViewData, mode: number) {
        super();
        this.viewData = viewData;
        this.kifuData = kifuData;

        this.isChecked = true;

        this.initBoardTypes = [
            '平手',
            '駒落ち',
            'カスタム'
        ]
        this.komaochiTypes = SHOGI.Info.komaochiTypes;
        this.kifuTypes = [
            '棋譜',
            '定跡'
        ];

        this.initBoardIndex = 0;
        this.komaochiIndex = SHOGI.KOMAOCHI.KYO;
        this.kifuTypeIndex = SHOGI.LIST.KIFU;

        this.view = () => {
            return [
                m('div', {class: c('c-shogiBan_menu_place')}, [
                    m('div', {class: c('c-shogiBan_menu_base')},[
                        m('label', {class: c('label', 'c-shogiBan_menu_label', 'is-main')}, '新規作成'),
                        m('div', {class: c('field', 'c-shogiBan_menu_option')}, [
                            m('label', {class: c('label', 'c-shogiBan_menu_label')}, '初期盤面'),
                            m('div', {class: c('control')}, [
                                m('div', {class: c('select')}, [
                                    m('select', {
                                        selected: this.initBoardIndex,
                                        onchange: m.withAttr('selectedIndex', 
                                        (value) => {
                                            this.initBoardIndex = value;
                                            this.boardApply();
                                        })
                                    }, [
                                        _.map(this.initBoardTypes, (value) => {
                                            return m('option', value)
                                        })
                                    ])
                                ])
                            ])
                        ]),

                        // 駒落ちを選択した場合のみ表示
                        (this.initBoardIndex === 1) ?
                        [
                            m('div', {class: c('c-shogiBan_menu_komaochi', 'field')}, [
                                m('label', {class: c('label', 'c-shogiBan_menu_label')}, '駒落ち詳細'),
                                m('input', {
                                    class: c('switch'), 
                                    checked : this.isChecked, 
                                    type: 'checkbox', 
                                    id:'handiTarget',
                                    onchange: m.withAttr('checked', (value) => {
                                        this.isChecked = value;
                                        this.boardApply();
                                    }),
                                }),
                                m('label', {class: c('c-shogiBan_menu_label'), for: 'handiTarget'}, (this.isChecked) ? '先手が駒落ち' : '後手が駒落ち')
                            ]),
                            m('div', {class: c('field', 'c-shogiBan_menu_option')}, [
                                m('div', {class: c('control')}, [
                                    m('div', {class: c('select')}, [
                                        m('select', {
                                            selected: this.komaochiIndex,
                                            onchange: m.withAttr('selectedIndex', 
                                            (value) => {
                                                this.komaochiIndex = value;                                              

                                                if(this.initBoardIndex === SHOGI.BAN.KOMAOCHI) {
                                                    this.boardApply();
                                                }
                                            })
                                        }, [
                                            _.map(this.komaochiTypes, (value) => {
                                                return m('option', value)
                                            })
                                        ])
                                    ])
                                ])
                            ])
                        ]
                        :
                        null
                        ,

                        m('div', {class: c('field', 'c-shogiBan_menu_option')}, [
                            m('label', {class: c('label', 'c-shogiBan_menu_label')}, '入力形式'),
                            m('div', {class: c('control')}, [
                                m('div', {class: c('select'),}, [
                                    m('select', {
                                        selected: this.kifuTypeIndex,
                                        onchange: m.withAttr('selectedIndex',(value) => {
                                            this.kifuTypeIndex = value;
                                        })
                                    }, [
                                        _.map(this.kifuTypes, (value) => {
                                            return m('option', value)
                                        })
                                    ])
                                ])
                            ])
                        ]),
                        m('div', {class: c('field', 'c-shogiBan_menu_button')}, [
                            m('div', {class: c('control')}, [
                                (this.initBoardIndex === 2) ?
                                m('div', {
                                    class: c('button', 'is-danger'),
                                    onclick: () => {
                                        // 盤面入力ステートへ
                                        const kifuType = (this.kifuTypeIndex === SHOGI.LIST.KIFU) ? 'KIFU' : 'JOSEKI';

                                        this.viewData.switchCustomCreate(kifuType);
                                    }
                                }, '盤面入力へ')
                                :
                                m('div', {
                                    class: c('button', 'is-primary'),
                                    onclick: () => {
                                        // 棋譜編集モードへ
                                        let preset = 'HIRATE';

                                        switch(this.initBoardIndex) {
                                            case SHOGI.BAN.HIRATE:
                                                preset = 'HIRATE';
                                                break;
                                            case SHOGI.BAN.KOMAOCHI:
                                                if(this.isChecked) {
                                                    // 先手
                                                    switch(this.komaochiIndex) {
                                                        case SHOGI.KOMAOCHI.KYO:
                                                            preset = 'KY';
                                                            break;
                                                        case SHOGI.KOMAOCHI.KAKU:
                                                            preset = 'KA';
                                                            break;
                                                        case SHOGI.KOMAOCHI.HISHA:
                                                            preset = 'HI';
                                                            break;
                                                        case SHOGI.KOMAOCHI.HIKYO:
                                                            preset = 'HIKY';
                                                            break;
                                                        case SHOGI.KOMAOCHI.NI:
                                                            preset = '2';
                                                            break;
                                                        case SHOGI.KOMAOCHI.YON:
                                                            preset = '4';
                                                            break;
                                                        case SHOGI.KOMAOCHI.ROKU:
                                                            preset = '6';
                                                            break;
                                                        case SHOGI.KOMAOCHI.HACHI:
                                                            preset = '8';
                                                            break;
                                                    }
                                                }else {
                                                    // 後手
                                                    preset = 'OTHER';
                                                }
                                                break;
                                            case SHOGI.BAN.CUSTOM:
                                                // カスタムの場合はこのボタンから遷移しえない
                                                throw new KifuError('自由配置の棋譜はcustomcreateステートを経由する必要があります。');
                                        }

                                        const kifuType = (this.kifuTypeIndex === SHOGI.LIST.KIFU) ? 'KIFU' : 'JOSEKI';
                                        console.log(this.kifuTypeIndex);

                                        this.viewData.switchEditStart(preset, kifuType);
                                    }
                                }, '作成する') 
                            ])
                        ])
                    ])
                ])
            ];
        };
    }

    public boardApply () {
        switch(this.initBoardIndex) {
            case SHOGI.BAN.HIRATE:
                this.viewData.createBoard = SHOGI.Info.hirateBoard;
                break;
            case SHOGI.BAN.KOMAOCHI:
                if(this.isChecked) {
                    this.viewData.createBoard = SHOGI.Info.komaochiBoards[this.komaochiIndex];
                }else {
                    this.viewData.createBoard = _.cloneDeep(SHOGI.Info.komaochiBoards[this.komaochiIndex]);
                    this.viewData.createBoard = 
                    _.each(this.viewData.createBoard, (boardRow) => {
                        _.each(boardRow, (koma) => {
                            if(_.has(koma, 'color')) {
                                koma['color'] = 1 - koma['color'];
                            }
                        })
                    });
                    this.viewData.createBoard = 
                    _.map(_.reverse(this.viewData.createBoard), (boardRow) => {
                        return _.reverse(boardRow as Array<Object>) as Array<Object>;
                    });
                }
                break;
            case SHOGI.BAN.CUSTOM:
                this.viewData.createBoard = [
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                    [{}, {}, {}, {}, {}, {}, {}, {}, {}]
                ];
                break;
        }
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

    // 新規作成メニュー
    private createMenu: CreateMenu;
    

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

        this.createInitData(jkfData, mode);

        this.oncreate = (vnode) => {
            // 初期状態でfocusさせる
            const elm = vnode.dom as HTMLElement;
            elm.focus();
        }

        this.onupdate = () => {
            if(this.viewData.state === STATE.EDITSTART) {
                // ここで新規作成時のjkfObjct作成処理
                let jkfObject = {
                    initial: {
                        'preset': this.viewData.initBoardPreset,
                        'mode'  : this.viewData.kifuType
                    }
                };

                if(this.viewData.initBoardPreset === 'OTHER') {
                    jkfObject.initial['data'] = {
                        board: this.viewData.createBoard,
                        color: 0,
                        hands: this.viewData.createHands
                    };
                }

                this.createInitData(jkfObject, SHOGI.MODE.EDIT);

                m.redraw();
            }
        }

        this.view = (vnode) => {
            return [
                m('div', {
                    class: c('c-kifuPlayer'),
                    tabindex: 1,
                    onkeydown: (e: KeyboardEvent) => {
                        if(mode === SHOGI.MODE.VIEW || mode === SHOGI.MODE.EDIT) {
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
                    }
                }, [
                    m('div', {class: c('c-kifuPlayer_inner')}, [
                        m('div', {class: c('c-shogiBan')}, [
                            m(this.shogiBan),
                            m('div', {class: c('c-shogiBan_grid')}),

                            // ここに新規作成用メニューを作る
                            (mode === SHOGI.MODE.CREATE && this.viewData.state === STATE.CREATE) ?
                            m(this.createMenu)
                            :
                            null,
                            m('div', {class: c('c-shogiBan_bg')}, [
                                m('div', {class: c('c-shogiBan_base')})
                            ]),
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

    public createInitData(jkfData: Object, mode: number) {
        this.kifuData = new KifuData(jkfData, mode);

        this.viewData = new ViewData(mode);

        // 将棋盤のViewコンポーネントを作成
        this.shogiBan = new ShogiBan(this.kifuData, this.viewData, mode);

        // 棋譜リストのViewコンポーネントを作成
        this.kifuList = new KifuList(this.kifuData, this.viewData, mode);

        // 棋譜プレイヤー操作ツールバーのViewコンポーネントを作成
        this.toolbar = new KifuToolBar(this.kifuData, this.viewData, mode);

        // 棋譜新規作成メニューのコンポーネントを作成
        this.createMenu = (mode === SHOGI.MODE.CREATE) ? new CreateMenu(this.kifuData, this.viewData, mode) : null;

        // 編集モードで棋譜が初期盤面からのみの場合最初から編集モードに移行する
        if(mode == SHOGI.MODE.EDIT && _.size(this.kifuData.moveArray) === 1) {
            this.viewData.switchInput(this.kifuData.moveNum, this.kifuData.color);
        }
    }
}
