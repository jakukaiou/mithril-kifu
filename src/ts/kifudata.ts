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

        this.comments = _.has(move,'comments') ? move['comments'] : null;

        if(this.comments) {
            this.comment = '';
            _.map(this.comments,(comment) => {
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
                if(_.has(moveInfo, 'promote')){
                    komaString = (moveInfo['promote']) ? komaString + '成' : komaString;
                }

                // 先手or後手の文字列
                const turnString = (moveInfo['color'] === 0) ? '☗' : '☖';

                if(!_.has(moveInfo, 'same')){
                    // 前の手と異なる位置への指し手

                    // 数字の漢字
                    const kanjiNum:Array<string> = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

                    // 駒の移動先座標の文字列
                    const moveString = moveInfo['to']['x'] + kanjiNum[moveInfo['to']['y']];

                    return turnString + moveString + komaString;
                }else {
                    // 前の手と同じ位置への指し手
                    return turnString + '同' + komaString;
                }
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

    // 盤面の表示配列 (盤面へはメソッドを介してアクセスする)
    private _board;
    
    // 持ち駒の情報 [0]は先手、[1]は後手
    private _hands;

    // movesから作成した現在の指し手配列
    private _moveArray: Array< MoveInfo | {[key: number]: MoveInfo;}>;

    // 現在の各分岐点における分岐インデックスの配列
    private forkPoint: {[key: number]: number;};

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

    // 編集モードかどうか
    private mode;

    // 現在のフォーカスポイント
    private _focus;

    constructor(jkfData: Object, mode: number) {

        this.mode = mode;

        // 指し手情報のコピー
        if(_.has(jkfData, 'moves')) {
            this.moves = _.cloneDeep(jkfData['moves']);
        }else {
            this.moves = [];
        }

        this.forkPoint = {};
        // 全てのforkを0として初期の分岐を作成
        this.makeInitialMove();
        
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
        if(_.has(this.forkPoint, moveNum)) {
            return <MoveInfo>this._moveArray[moveNum][this.forkPoint[moveNum]];
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
        if(_.has(this.forkPoint, forkNum)) {
            return this._moveArray[forkNum] as {[key: number]: MoveInfo;};
        }else {
            throw new KifuDataError('_moveArray[forkNum] is not Array');
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
        if(_.has(this.forkPoint, moveNum)) {
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
     * 与えられた指し手番号の盤面に更新
     * 
     * @param moveNum: 指し手番号
     * 
     */
    public set moveNum(updateNum: number) {
        // 更新後の指し手が現在のものと異なる場合のみ更新処理を行う
        if(this._moveNum !== updateNum) {
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
     * 現在の盤面の駒を返す
     * 
     * @param x: 盤面の横位置
     * @param y: 盤面の縦位置
     * 
     * @return Object
     */
    public getBoardPiece(x: number, y: number): Object {
        return this._board[y - 1][9 - x];
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
    private setBoardPiece(x: number, y: number, info: Object) {
        this._board[y - 1][9 - x] = _.cloneDeep(info);
    }

    /**
     * 現在のフォーカス位置を返す
     * 
     * @return Array<Array<Object>>
     */
    public get focus(): Object {
        return this._focus;
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
     * 現在の指し手番号を返す
     * 
     * @return number
     */
    public get moveNum(): number {
        return this._moveNum;
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
     * moveArray, forkPointの初期値を設定
     * 
     * 
     */
    public makeInitialMove() {
        // TODO: forks内が配列でない場合例外を投げる？
        const moveLength = this.moves.length;

        this._moveArray = [];

        let forkArray: {[key: number]: MoveInfo;} = null;
        let forkNum = 1;

        for(let i = 0; i < moveLength ; i++) {
            const isFork = _.has(this.moves[i], 'forks');

            if(!isFork) {
                this._moveArray.push(new MoveInfo(this.moves[i], false));
            }else {
                forkArray = {};

                forkArray[0] = new MoveInfo(this.moves[i], true);

                //初期の分岐はひとつめのものを使う
                this.forkPoint[i] = 0;

                forkNum = 1;
                _.each(this.moves[i]['forks'],(forkMove) => {
                    forkArray[forkNum] = new MoveInfo(forkMove[0], true);
                    forkNum++;
                });

                this._moveArray.push(_.cloneDeep(forkArray));
            }
        }
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

        // 更新部分の配列を削除
        this._moveArray = _.slice(this._moveArray, 0, (moveNum + 1));

        // forkPointを修正
        this.forkPoint = _.pickBy(this.forkPoint, (value, key)=>{
            // trueを返したものをpickする
            return (+key < moveNum) ? true : false
        }) as { [key: number]: number; };
        this.forkPoint[moveNum] = forkNum;
        

        this.forkPoint[moveNum] = forkNum;

        if(forkNum !== 0) {
            // ループ対象となる指し手オブジェクトを代入
            const targetMoveArray = this.getForkMoveObj(moveNum);

            // 指し手オブジェクトの更新
            const moveLength = _.size(targetMoveArray);
            let forkArray: {[key: number]: MoveInfo;} = null;
            if(moveLength){
                for(let i = 0; i < moveLength ; i++) {
                    const isFork = _.has(targetMoveArray[i], 'forks');
                    if(!isFork) {
                        this._moveArray.push(new MoveInfo(targetMoveArray[i], false));
                    }else {
                        
                        forkArray = {};

                        forkArray[0] = new MoveInfo(targetMoveArray[i], true);

                        // 初期の分岐はひとつめのものを使う
                        this.forkPoint[moveNum + i + 1] = 0;

                        forkNum = 1;
                        _.each(targetMoveArray[i]['forks'],(forkMove) => {
                            forkArray[forkNum] = new MoveInfo(forkMove[0], true);
                            forkNum++;
                        });

                        this._moveArray.push(_.cloneDeep(forkArray));
                    }
                }
            }
        }else{
            // 通常分岐に戻る場合はmakeInitalMoveと同様の処理
            const targetMoveArray = this.getForkMoveObj(moveNum, true);

            // 指し手オブジェクトの更新
            const moveLength = _.size(targetMoveArray);
            let forkArray: {[key: number]: MoveInfo;} = null;

            for(let i = 0; i < moveLength ; i++) {
                const isFork = _.has(targetMoveArray[i], 'forks');

                if(!isFork) {
                    this._moveArray.push(new MoveInfo(targetMoveArray[i], false));
                }else {
                    
                    forkArray = {};

                    forkArray[0] = new MoveInfo(targetMoveArray[i], true);

                    // 初期の分岐はひとつめのものを使う
                    this.forkPoint[moveNum + i] = 0;

                    forkNum = 1;
                    _.each(targetMoveArray[i]['forks'],(forkMove) => {
                        forkArray[forkNum] = new MoveInfo(forkMove[0], true);
                        forkNum++;
                    });

                    this._moveArray.push(_.cloneDeep(forkArray));
                }
            }
        }

        // TODO: switchしたのが現在の盤面、またはそれ以前の盤面の場合、分岐盤面への更新処理を行う
        if(this.moveNum === moveNum){
            this.moveNum--;
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

        _.each(this.forkPoint, (forkNum, forkPos) => {
            if((+forkPos) > moveNum) {
                skipFlag = true;
            }else{
                moveCount = (+forkPos);
            }

            if(!skipFlag){
                const pos = +forkPos;
                if(moveNum === moveCount && major){
                    tmpMoveObj = _.slice(tmpMoveObj, (pos - basePos + 1))
                }else {
                    tmpMoveObj = tmpMoveObj[pos - basePos]['forks'][(+forkNum - 1)];
                }
                basePos = pos;
            }
        });

        if(moveNum !== moveCount) {
            if(moveNum > moveCount){
                throw new KifuDataError('moveNumの位置の指し手が分岐を持っていない');
            }else {
                throw new KifuDataError('getMoveObjのバグ');
            }
        }

        if(major) {
            return tmpMoveObj;
        }else{
            return _.slice(tmpMoveObj, 1);
        }
    }
}
