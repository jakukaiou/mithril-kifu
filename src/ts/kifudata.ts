import * as _ from 'lodash';

import * as SHOGI from './shogi';

/**
 * エラー処理用クラス
 */
class KifuDataError implements Error {
    public name = 'KifuDataError';

    constructor(public message: string) {

    }

    toString() {
        return this.name + ': ' + this.message;
    }
}

class KifuPos {
    public x: number;
    public y: number;

    constructor(X: number, Y: number) {
        this.x = X;
        this.y = Y;
    }

    public reverse(): KifuPos {
        return new KifuPos(10 - this.x,10 - this.y);
    }
}

/**
 * 指し手のデータを扱うクラス
 */
class MoveInfo {
    // 指し手の棋譜表示名
    public moveName: string;

    // 指し手についているコメント
    public comment: string;

    // 分岐する指し手かどうか
    public fork: boolean;

    // 持ち駒から置く手かどうか
    public isPut: boolean;

    // 移動元情報
    public from: Object;

    // 移動先情報
    public to: Object;

    // 同がつくかどうか
    public isSame: boolean;

    // 成るかどうか
    public isPromote: boolean;

    // 取った駒
    public capture: string;

    // プレイヤー
    public color: number;

    // 駒の種類
    public kind: string;

    // 指し手のコメント配列
    private comments: Array<string>;

    /**
     * ボードの情報を返す
     * 
     * @param move: 入力された指し手オブジェクト
     * @param isFork: 分岐する指し手かどうか
     * 
     */
    constructor(move: Object, fork: boolean = false) {
        this.moveName = this.getMoveName(move);

        this.fork = fork;

        this.comments = _.has(move, 'comments') ? move['comments'] : null;

        if(this.comments) {
            this.comment = '';
            _.map(this.comments, (comment) => {
                this.comment += comment;
            });
        }else {
            this.comment = null;
        }

        this.isPut = false;

        // 指し手情報をもつか判定
        if(_.has(move, 'move')) {
            
            // 持ち駒から置く手かどうか判定
            if(_.has(move['move'], 'from')) {
                this.from = move['move']['from'];
            }else {
                this.isPut = true;
            }

            // 持ち駒から置く手かどうか判定
            if(_.has(move['move'], 'to')) {
                this.to = move['move']['to'];
            }else {
                throw new KifuDataError('move Object do not have "to" property');
            }

            // プレイヤー情報をセット
            if(_.has(move['move'], 'color')) {
                this.color = move['move']['color'];
            }else {
                throw new KifuDataError('not defined player info');
            }

            // 駒情報をセット
            if(_.has(move['move'], 'piece')) {
                this.kind = move['move']['piece'];
            }else {
                throw new KifuDataError('not defined piece info');
            }

            // 成るかどうか判定
            if(_.has(move['move'], 'promote')) {
                this.isPromote = move['move']['promote'];
            }else {
                this.isPromote = false;
            }

            // 「同」がつくか判定
            if(_.has(move['move'], 'same')) {
                this.isSame = move['move']['same'];
            }else {
                this.isSame = false;
            }

            // 駒を取ったか判定
            if(_.has(move['move'], 'capture')) {
                this.capture = move['move']['capture'];
            }else {
                this.capture = null;
            }
        } else {
            this.from = null;
            this.to = null;
        }
    }

    /**
     * 指し手オブジェクトから指し手の名称を返す
     * 
     * @param move: 指し手オブジェクト
     * 
     * @return string
     */
    private getMoveName(move: Object): string {
        if(_.has(move, 'move')) {
            if(_.has(move['move'], 'to') && _.has(move['move'], 'color') && _.has(move['move'], 'piece')) {
                const moveInfo = move['move'];

                // 駒名の文字列
                let komaString = SHOGI.Info.getKanji(SHOGI.Info.komaAtoi(moveInfo['piece']));

                // 成る場合「成」を駒名に追加
                if(_.has(moveInfo, 'promote')) {
                    komaString = (moveInfo['promote']) ? komaString + '成' : komaString;
                }

                // 先手or後手の文字列
                const turnString = (moveInfo['color'] === 0) ? '☗' : '☖';

                // 指し手位置の文字列
                let moveString = '同';
                if(!_.has(moveInfo, 'same')) {
                    // 前の手と異なる位置への指し手

                    // 数字の漢字
                    const kanjiNum: Array<string> = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

                    // 駒の移動先座標の文字列
                    moveString = moveInfo['to']['x'] + kanjiNum[moveInfo['to']['y']];   
                }

                // 相対情報を駒名に付加
                if(!_.has(moveInfo, 'relative')) {
                    const relativeString = moveInfo['relative'];

                    switch(relativeString){
                        case 'L':
                            komaString = komaString + '左';
                            break;
                        case 'C':
                            komaString = komaString + '直';
                            break;
                        case 'R':
                            komaString = komaString + '右';
                            break;
                        case 'U':
                            komaString = komaString + '上';
                            break;
                        case 'M':
                            komaString = komaString + '寄';
                            break;
                        case 'D':
                            komaString = komaString + '引';
                            break;
                    }
                }

                return turnString + moveString + komaString;
            }else {
                throw new KifuDataError('move to property not defined');
            }
        }else {
            return'初期局面'; 
        }
    }
}

/**
 * 現在の盤面データを表すクラス
 */
export default class KifuData {
    // 定跡 or 棋譜
    public listmode;

    // 盤面の表示配列 (盤面へはメソッドを介してアクセスする)
    private _board;
    
    // 持ち駒の情報 [0]は先手、[1]は後手
    private _hands;

    // movesから作成した現在の指し手配列
    private _moveArray: Array< MoveInfo | {[key: number]: MoveInfo;}>;

    // 現在の各分岐点における分岐インデックスの配列
    private forkPoints: {[key: number]: number;};

    // 初期の盤面配列
    private initBoard;

    // 初期の持ち駒
    private initHands;

    // 現在の手番 先手or後手
    private color;

    // 現在の指し手番号
    private _moveNum;

    // 指し手の配列
    private moves;

    // 初期の指し手配列
    private initMoves;

    // 編集モードかどうか
    private mode;

    // 現在のフォーカスポイント
    private _focus;

    constructor(jkfData: Object, mode: number) {

        this.mode = mode;

        // 指し手情報のコピー
        if(_.has(jkfData, 'moves')) {
            this.initMoves = jkfData['moves'];
        }else {
            this.initMoves = [];
        }

        this.moves = _.cloneDeep(this.initMoves);

        this.forkPoints = {};
        // 全てのforkを0として初期の分岐を作成
        this.makeInitialMove();

        // TODO: ここの判断はjkfのヘッダ情報を利用する？
        if(this.forkPoints === {}){
            this.listmode === SHOGI.LIST.KIFU;
        }else{
            this.listmode === SHOGI.LIST.ZYOSEKI;
        }
        
        // 平手状態
        this.initBoard = 
        [
            [{color: 1, kind: 'KY'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'KY'}],
            [{                    }, {color: 1, kind: 'HI'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 1, kind: 'KA'}, {                    }],
            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
        ];
        this.initHands = [{}, {}];
        this.color = 0;

        // 初期の指し手
        this._moveNum = 0;

        // 特殊な初期状態が登録されているか判定
        if(_.has(jkfData, 'initial')) {
            // 特殊初期状態

            // プリセットが未定義ならエラー
            if(! _.has(jkfData['initial'], 'preset')) {
                throw new KifuDataError('jkf preset not defined');
            }else {
                switch(jkfData['initial']['preset']) {
                    case 'HIRATE':  // 平手
                        // 平手は代入済
                        break;
                    case 'KY':     // 香落ち
                        this.initBoard = 
                        [
                            [{color: 1, kind: 'KY'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {                    }],
                            [{                    }, {color: 1, kind: 'HI'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 1, kind: 'KA'}, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case 'KY_R':     // 右香落ち
                        this.initBoard = 
                        [
                            [{                    }, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'KY'}],
                            [{                    }, {color: 1, kind: 'HI'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 1, kind: 'KA'}, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case 'KA':     // 角落ち
                        this.initBoard = 
                        [
                            [{color: 1, kind: 'KY'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'KY'}],
                            [{                    }, {color: 1, kind: 'HI'}, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case 'HI':     // 飛車落ち
                        this.initBoard = 
                        [
                            [{color: 1, kind: 'KY'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'KY'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 1, kind: 'KA'}, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case 'HIKY':  // 飛香落ち
                        this.initBoard = 
                        [
                            [{color: 1, kind: 'KY'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 1, kind: 'KA'}, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case '2':  // 2枚落ち
                        this.initBoard = 
                        [
                            [{color: 1, kind: 'KY'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {color: 1, kind: 'KY'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case '4':  // 4枚落ち
                        this.initBoard = 
                        [
                            [{                    }, {color: 1, kind: 'KE'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {color: 1, kind: 'KE'}, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case '6':  // 6枚落ち
                        this.initBoard = 
                        [
                            [{                    }, {                    }, {color: 1, kind: 'GI'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {color: 1, kind: 'GI'}, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case '8':  // 8枚落ち
                        this.initBoard = 
                        [
                            [{                    }, {                    }, {                    }, {color: 1, kind: 'KI'}, {color: 1, kind: 'OU'}, {color: 1, kind: 'KI'}, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case '10':  // 10枚落ち
                        this.initBoard = 
                        [
                            [{                    }, {                    }, {                    }, {                    }, {color: 1, kind: 'OU'}, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}, {color: 1, kind: 'FU'}],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }, {                    }],
                            [{color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}, {color: 0, kind: 'FU'}],
                            [{                    }, {color: 0, kind: 'KA'}, {                    }, {                    }, {                    }, {                    }, {                    }, {color: 0, kind: 'HI'}, {                    }],
                            [{color: 0, kind: 'KY'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'OU'}, {color: 0, kind: 'KI'}, {color: 0, kind: 'GI'}, {color: 0, kind: 'KE'}, {color: 0, kind: 'KY'}]
                        ];
                        break;
                    case 'OTHER':  // その他
                        if(_.has(jkfData['initial'], 'data')) {
                            // 初期盤面のセット
                            if(_.has(jkfData['initial']['data'], 'board')) {
                                this.initBoard = _.cloneDeep(jkfData['initial']['data']['board']);
                            }else {
                                // otherプリセット用の初期盤面データがない場合はエラー
                                throw new KifuDataError('jkf OTHER preset board not defined');
                            }

                            // 初期持ち駒のセット
                            if(_.has(jkfData['initial']['data'], 'hands')) {
                                this.initHands = _.cloneDeep(jkfData['initial']['data']['hands']);
                            }

                            // 初期手番のセット
                            if(_.has(jkfData['initial']['data'], 'color')) {
                                this.color = jkfData['initial']['data']['color'];
                            }
                        }else {
                            // otherプリセット用の初期データがない場合はエラー
                            throw new KifuDataError('jkf OTHER preset data not defined');
                        }
                        break;
                    default: 
                        // 該当のプリセットなし
                        throw new KifuDataError('jkf preset not found');
                }
            }
        }else {
            // 初期状態がなければ平手
            // 平手は代入済
        }
        
        // 初期盤面を現在盤面にコピー
        this._board = _.cloneDeep(this.initBoard);
        this._hands = _.cloneDeep(this.initHands);

        this._focus = null;
    }

    /**
     * 指し手の情報を返す
     * 
     * @param moveNum: 指し手番号
     * 
     * @return MoveInfo
     */
     public getMove(moveNum: number): MoveInfo {
        if(_.has(this.forkPoints, moveNum)) {
            return <MoveInfo>this._moveArray[moveNum][this.forkPoints[moveNum]];
        }else {
            return <MoveInfo>this._moveArray[moveNum];
        }
     }

     /**
      * 分岐部分の指し手一覧を返す
      * 
      * @param forkNum: 分岐する指し手番号
      * 
      * @return MoveInfo
      */
     public getForkList(forkNum: number): {[key: number]: MoveInfo;} {
        if(_.has(this.forkPoints, forkNum)) {
            return this._moveArray[forkNum] as {[key: number]: MoveInfo;};
        }else {
            return {};
        }
     }

     /**
      * 分岐している指し手の情報を返す
      * 
      * @param moveNum: 指し手番号
      * @param forkNum: 分岐番号
      * 
      * @return MoveInfo
      */
     public getForkMove(moveNum: number, forkNum: number): MoveInfo {
        if(_.has(this.forkPoints, moveNum)) {
            return <MoveInfo>this._moveArray[moveNum][forkNum];
        }else {
            throw new KifuDataError('_moveArray[forkNum] is not Array');
        }
     }

    /**
     * 新たな指し手を追加 (EditMode用)
     * 
     */
     public setMove() {
        if(this.mode === SHOGI.MODE.EDIT) {

        }else {
            throw new KifuDataError('not permit edit');
        }
     }

    /**
     * 現在の指し手番号を返す
     * 
     * @return number
     */
    public get moveNum(): number {
        return this._moveNum;
    }

    /**
     * 与えられた指し手番号の盤面に更新
     * 
     * @param moveNum: 指し手番号
     * 
     */
    public set moveNum(updateNum: number) {
        // 更新後の指し手が指し手配列の範囲内で、現在のものと異なる場合のみ更新処理を行う
        if(this._moveNum !== updateNum && updateNum >= 0 && updateNum < this.moveArray.length) {
            // _boardと_hands、_moveNumが更新の対象
            if(this._moveNum > updateNum) {
                // 更新後の指し手が現在の指し手より小さい場合(手を戻す)
                let tmpMoveNum = this._moveNum;

                while(tmpMoveNum > updateNum) {
                    // 盤面と持ち駒の更新処理

                    // 次に適用する指し手
                    const applyMove = this.getMove(tmpMoveNum);

                    let color = applyMove.color;

                    // 持ち駒から置く手かどうか判定
                    if(applyMove.isPut) {
                        let to = applyMove.to;

                        // 駒を配置
                        this.setBoardPiece(to['x'], to['y'], {                                        });

                        // 持ち駒を増やす
                        this.addHand(color, applyMove.kind);
                    }else {
                        let from = applyMove.from;
                        let to = applyMove.to;

                        let kind = applyMove.kind;

                        // 元の駒の位置を空に
                        this.setBoardPiece(to['x'], to['y'], {                                        });

                        // 駒を移動
                        this.setBoardPiece(from['x'], from['y'], {color: color, kind: kind});

                        // 駒を取っていた場合の戻し処理
                        if(applyMove.capture) {
                            let capture = applyMove.capture;

                            // 取っていた駒を盤に配置
                            this.setBoardPiece(to['x'], to['y'], {color: (1 - color), kind: capture});

                            // 持ち駒から駒を減らす
                            let hand = (SHOGI.Info.getOrigin(capture)) ? SHOGI.Info.getOrigin(capture) : capture;
                            this.deleteHand(color, hand);
                        }
                    }
                    
                    tmpMoveNum--;
                }
            }else
            if(this._moveNum < updateNum) {
                // 更新後の指し手が現在の指し手より小さい場合(手を進める)
                let tmpMoveNum = this._moveNum;

                while(tmpMoveNum < updateNum) {
                    // 盤面と持ち駒の更新処理

                    // 次に適用する指し手
                    const applyMove = this.getMove(tmpMoveNum + 1);

                    let color = applyMove.color;
                    
                    // 持ち駒から置く手かどうか判定
                    if(applyMove.isPut) {
                        let to = applyMove.to;

                        // 駒を配置
                        this.setBoardPiece(to['x'], to['y'], {color: color, kind: applyMove.kind});

                        // 持ち駒から駒を減らす
                        this.deleteHand(color, applyMove.kind);
                    }else {
                        let from = applyMove.from;
                        let to = applyMove.to;

                        let kind = (applyMove.isPromote) ? SHOGI.Info.getPromote(applyMove.kind) : applyMove.kind;

                        // 元の駒の位置を空に
                        this.setBoardPiece(from['x'], from['y'], {                                        });

                        // 駒を移動
                        this.setBoardPiece(to['x'], to['y'], {color: color, kind: kind});

                        // 駒を取った場合の処理
                        if(applyMove.capture) {
                            let capture = (SHOGI.Info.getOrigin(applyMove.capture)) ? SHOGI.Info.getOrigin(applyMove.capture) : applyMove.capture;

                            this.addHand(color, capture);
                        }
                    }
                    
                    tmpMoveNum++;
                }
            }else {
                throw new KifuDataError('illegal moveNum');
            }

            this._moveNum = updateNum;

            // focus盤面位置を更新
            let focusMove = this.getMove(this._moveNum);
            this._focus = (_.has(focusMove, 'to')) ? focusMove['to'] : null;
        } else {
            return;
        }
    }

    /**
     * 現在の盤面を返す
     * 
     * @return Array<Array<Object>>
     */
    public get board(): Array<Array<Object>> {
        return this._board;
    }

    /**
     * 現在の反転盤面を返す
     * 
     * @return Array<Array<Object>>
     */
    public get reverseBoard(): Array<Array<Object>> {
        
        const board = _.cloneDeep(this._board);

        return _.map( _.reverse(board),(boardRow)=>{
            return _.reverse(boardRow as Array<Object>) as Array<Object>;
        });
    }

    /**
     * 棋譜上の位置指定から盤面配列の位置指定に変換
     * 
     * @param x: ビュー配列上の横位置
     * @param y: ビュー配列上の縦位置
     * 
     * @return KifuPos
     */
    private kifuposToPos(kx: number, ky: number): KifuPos {
        return new KifuPos(9 - kx, ky - 1);
    }

    /**
     * 盤面配列の位置指定から棋譜上の位置指定に変換
     * 
     * @param x: ビュー配列上の横位置
     * @param y: ビュー配列上の縦位置
     * 
     * @return KifuPos
     */
    private posToKifupos(x: number, y: number): KifuPos {
        return new KifuPos(9 - x, y + 1);
    }

    /**
     * 現在の盤面の駒を返す
     * 
     * @param x: 盤面の横位置
     * @param y: 盤面の縦位置
     * 
     * @return Object
     */
    public getBoardPiece(kx: number, ky: number): Object {
        const pos = this.kifuposToPos(kx, ky);

        return this._board[pos.y][pos.x];
    }

    /**
     * 盤面の駒を更新
     * 
     * @param x: 盤面の横位置
     * @param y: 盤面の縦位置
     * 
     * @param info: 更新後の駒情報
     * 
     */
    private setBoardPiece(kx: number, ky: number, info: Object) {
        const pos = this.kifuposToPos(kx, ky);

        this._board[pos.y][pos.x] = _.cloneDeep(info);
    }

    /**
     * 指定座標がフォーカスしているかを返す
     * 
     * @param x: x座標
     * @param y: y座標
     * @param reverse: 反転状態で判定するかどうか
     * 
     * @return boolean
     */
    public isFocus(x: number, y: number,reverse: boolean = false): boolean {
        if(this._focus) {
            if(!_.has(this._focus,'x') || !_.has(this._focus,'y')) {
                throw new KifuDataError('focusオブジェクトのプロパティが不足しています。');
            }

            const pos = this.posToKifupos(x, y);
            const rPos = pos.reverse();

            const focusPos = new KifuPos(this._focus['x'], this._focus['y']);

            if(!(reverse) && focusPos.x === pos.x && focusPos.y === pos.y) {
                return true;
            }else if(reverse && focusPos.x === rPos.x && focusPos.y === rPos.y) {
                return true;
            }else {
                return false;
            }
        }else {
            return false;
        }
    }

    /**
     * 持ち駒を追加
     * 
     * @param komaString: 駒名
     * 
     * @param info: 更新後の駒情報
     * 
     */
    private addHand(player: number,komaString: string) {
        if(_.has(this._hands, player)) {
            if(_.has(this._hands[player], komaString)) {
                this._hands[player][komaString]++;
            }else {
                this._hands[player][komaString] = 1;
            }
        }else {
            throw new KifuDataError('illigal player number');
        }
    }

    /**
     * 持ち駒を減らす
     * 
     * @param komaString: 駒名
     * 
     * @param info: 更新後の駒情報
     * 
     */
    private deleteHand(player: number,komaString: string) {
        if(_.has(this._hands, player)) {
            if(_.has(this._hands[player], komaString)) {
                this._hands[player][komaString]--;
            }else {
                throw new KifuDataError('illigal komaString number');
            }
        }else {
            throw new KifuDataError('illigal player number');
        }
    }

    /**
     * 現在の両者持ち駒を返す
     * 
     * @return Array<Object>
     */
    public get hands(): Array<Object> {
        return this._hands;
    }

    /**
     * 現在の指し手配列を返す
     * 
     * @return number
     */
     public get moveArray(): Array< MoveInfo | {[key: number]: MoveInfo;}> {
         return this._moveArray;
     }

     /**
      * 現在の指し手配列に新たな指し手を追加
      * 
      * @param moves: 追加する指し手
      * @param fork: 追加する指し手が分岐配列かどうか
      * 
      * @return number
      */
     private moveArrayAdd(moves) {
        let forkArray: {[key: number]: MoveInfo;} = null;
        let forkNum = 1;

        const moveLength = moves.length;

        // forkPointsを更新する際に使う
        const addPoint = _.size(this._moveArray);

        for(let i = 0; i < moveLength ; i++) {
            const isFork = _.has(moves[i], 'forks');

            if(!isFork) {
                this._moveArray.push(new MoveInfo(moves[i], false));
            }else {
                forkArray = {};

                forkArray[0] = new MoveInfo(moves[i], true);

                // 初期の分岐はひとつめのものを使う
                this.forkPoints[addPoint + i] = 0;

                forkNum = 1;
                _.each(moves[i]['forks'],(forkMove) => {
                    forkArray[forkNum] = new MoveInfo(forkMove[0], true);
                    forkNum++;
                });

                this._moveArray.push(_.cloneDeep(forkArray));
            }
        }
     }

     /**
      * 現在の指し手配列の分岐後の指し手を削除する
      * 
      * @param forkPoint: 分岐地点の番号
      * 
      * @return number
      */
     private moveArrayDelete(forkNum: number) {
        this._moveArray = _.slice(this._moveArray, 0, (forkNum + 1));
     }

     // TODO: moveオブジェクトを作成する
     private makeMoveData(toX: number, toY: number, fromX: number, fromY: number, same: boolean, promote: boolean) {

     }

     

     // TODO: 該当の指し手データを追加する
     private moveAdd(moveNum: number, moveData: Object) {

     }
     
     // TODO: 該当の指し手データを削除する
     private moveDelete(moveNum: number, forkNum: number = 0) {

     }

     // TODO: 各オブジェクトを_.hasでチェックするバリデーションチェック用関数を作る？

     /**
      * 指し手分岐をスイッチする
      * 
      * @param x: boardのx座標
      * @param y: boardのy座標
      * 
      * @return Array<Array<number>>;
      *
      */
     public makeMoveArea(x: number, y: number):Array<Array<number>> {
        
        let area:Array<Array<number>> = [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];

        const targetKoma = this._board[y][x];

        if(targetKoma === {}){
            return area;
        }

        const color = targetKoma['color'];

        //移動対象の駒座標
        const pos = new KifuPos(x, y);

        const komaMoves = SHOGI.Info.getMoves(SHOGI.Info.komaAtoi(targetKoma['kind']));


        // x,yが範囲内かどうか調べる
        const inRange = (x: number, y: number) => {
            if(x >= 0 && x < 9 && y >= 0 && y < 9){
                return true;
            }else {
                return false;
            }
        }

        _.each(komaMoves, (move) => {
            // 駒の動きをひとつずつ検討し、areaを確定する
            let x = move['x'];
            let y = move['y'];

            
            if(!color){
                // 先手の場合
                y *= (-1);
            }else {
                // 後手の場合
                x *= (-1);
            }

            switch(move['type']){
                case 'pos':
                    if(inRange(pos.y + y, pos.x + x)){
                        if(this._board[pos.y + y][pos.x + x] === {}){
                            area[pos.y + y][pos.x + x] = 1;
                        }else {
                            if(this._board[pos.y + y][pos.x + x]['color'] != color){
                                area[pos.y + y][pos.x + x] = 1;
                            }
                        }
                    }
                    break;
                case 'dir':
                    let movable = true;
                    let nextX = pos.x;
                    let nextY = pos.y;

                    while(movable) {
                        nextX += x;
                        nextY += y;
                        if(inRange(nextY, nextX)) {
                            if(this._board[nextY][nextX] === {}){
                                area[nextY][nextX] = 1;
                            }else {
                                if(this._board[nextY][nextX]['color'] != color){
                                    area[nextY][nextX] = 1;
                                }else {
                                    movable = false;
                                }
                            }
                        }else {
                            movable = false;
                        }
                    }
                    break;
                default:
                    throw new KifuDataError('未知の移動タイプです。');
            }
        })

        return area;
     }

    /**
     * moveArray, forkPointの初期値を設定
     * 
     * 
     */
    public makeInitialMove() {
        const moveLength = this.moves.length;

        this._moveArray = [];

        this.moveArrayAdd(this.moves);
    }

    /**
     * 指し手分岐をスイッチする
     * 
     * @param moveNum: 指し手番号
     * @param forkNum: 分岐番号
     * 
     */
    public switchFork(moveNum: number, forkNum: number) {
        // _board,_hands,_moveArrayが更新対象

        // 更新の必要がない場合何もしない
        if(this.moveNum === moveNum && forkNum === this.forkPoints[moveNum]) {
            return;
        }

        // moveNumが0ならエラーを出す
        if(moveNum <= 0) {
            throw new KifuDataError('初期盤面では棋譜分岐できません。');
        }

        // 現在の指し手が分岐後のものの場合指し手を戻す
        let moveLeap: boolean = false;
        if(this.moveNum >= moveNum) {
            this.moveNum = (moveNum - 1);
            moveLeap = true;
        }

        // 更新部分の配列を削除
        this.moveArrayDelete(moveNum);

        // forkPointを修正
        this.forkPoints = _.pickBy(this.forkPoints, (value, key) => {
            // trueを返したものをpickする
            return (+key < moveNum) ? true : false;
        }) as { [key: number]: number; };
        this.forkPoints[moveNum] = forkNum;

        if(forkNum !== 0) {
            // ループ対象となる指し手オブジェクトを代入
            const targetMoveArray = this.getForkMoveObj(moveNum);

            // 指し手オブジェクトの更新
            this.moveArrayAdd(targetMoveArray);
        }else {
            // 通常分岐に戻る場合はmakeInitalMoveと同様の処理
            const targetMoveArray = this.getForkMoveObj(moveNum, true);

            // 指し手オブジェクトの更新
            this.moveArrayAdd(targetMoveArray);
        }

        // 手を戻っている場合分岐地点に指し手を進める
        if(moveLeap) {
            this.moveNum++;
        }
    }

    /**
     * moveNumとforkListから分岐点指し手情報オブジェクトの位置を返す
     * 
     * @param moveNum: 分岐を持つ指し手番号
     * @param major:   主分岐の取得かどうか
     * 
     * @return Object
     * 
     */
    private getForkMoveObj(moveNum: number, major: boolean = false) {
        let moveCount = 0;
        let basePos = 0;
        let skipFlag = false;

        let tmpMoveObj = this.moves;

        _.each(this.forkPoints, (forkNum, forkPos) => {
            if((+forkPos) > moveNum) {
                skipFlag = true;
            }else {
                moveCount = (+forkPos);
            }

            if(!skipFlag) {
                const pos = +forkPos;
                if(moveNum === moveCount && major) {
                    tmpMoveObj = _.slice(tmpMoveObj, (pos - basePos + 1));
                }else {
                    tmpMoveObj = tmpMoveObj[pos - basePos]['forks'][(+forkNum - 1)];
                }
                basePos = pos;
            }
        });

        if(moveNum !== moveCount) {
            if(moveNum > moveCount) {
                throw new KifuDataError('moveNumの位置の指し手が分岐を持っていない');
            }else {
                throw new KifuDataError('getMoveObjのバグ');
            }
        }

        if(major) {
            return tmpMoveObj;
        }else {
            return _.slice(tmpMoveObj, 1);
        }
    }
}
