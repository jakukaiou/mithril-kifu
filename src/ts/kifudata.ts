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
 * ゲーム上の駒のデータを扱うクラス
 */
class KomaState {

    // 駒の持ち主
    private owner;

    // 成っているかどうか
    private isPromote;

    // 盤面に存在するかどうか
    private onBoard;

    /**
     * ボードの情報を返す
     * 
     * @param color: 先手 or 後手  
     * @param komaType: 駒の番号
     * @param x: 盤面上のx軸番号指定
     * @param y: 盤面上のy軸番号指定
     * 
     * @return KomaState
     */
    constructor(color: number, komaType: number, x: number, y: number) {
        
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
    private _moveArray;

    // 現在の各分岐点における分岐インデックスの配列
    private forkPoint: {[key: number]: number;};

    // 初期の盤面配列
    private initBoard;

    // 初期の持ち駒
    private initHands;

    // 現在の手番 先手or後手
    private color;

    // 現在のコメント
    private _comment;

    // 現在の指し手番号
    private _moveNum;

    // 指し手の配列
    private moves;

    // 編集モードかどうか
    private mode;

    constructor(jkfData: Object, mode: number) {

        this.mode = mode;

        // 指し手情報のコピー
        if(_.has(jkfData, 'moves')) {
            this.moves = _.cloneDeep(jkfData['moves']);
        }else {
            this.moves = [];
        }

        this._moveArray = [];
        this.forkPoint = {};
        // 全てのforkを0として初期の分岐を作成
        this.makeInitialMove(this.moves, this.moveArray, this.forkPoint);
        
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

        // 初期のコメント
        this._comment = '';

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
    }

    /**
     * ボードの情報を返す
     * 
     * @param x: 盤面上のx軸番号指定 
     * @param y: 盤面上のy軸番号指定
     * 
     * @return KomaState
     */
    public getBoard(x: number, y: number): KomaState {
        return new KomaState(0, SHOGI.KOMA.FU, x, y);
    }

    /**
     * 新たな指し手を追加
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
    public set moveNum(moveNum: number) {
        // 更新後の指し手が現在のものと異なる場合のみ更新処理を行う
        if(this._moveNum !== moveNum) {

            /*
            if(this.moves){
                //コメントの更新
                if(_.has(this.moves[moveNum], 'message')) {
                    this.comment = this.moves[moveNum]['message'];
                }
            }
            */
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
     * 現在の指し手のコメントを返す
     * 
     * @return string
     */
    public get comment(): string {
        return this._comment;
    }

    /**
     * 現在の指し手配列を返す
     * 
     * @return number
     */
     public get moveArray(): Array<Object> {
         return this._moveArray;
     }

    /**
     * moveArray, forkPointの初期値を設定
     * 
     * @param moves: 指し手データ
     * 
     */
    public makeInitialMove(moves: Array<Object>, _moveArray: Array<Object>, forkPoint: {[key: number]: number; }) {
        const moveLength = moves.length;

        for(let i = 0; i < moveLength ; i++) {
            _moveArray.push(moves[i]);
            if(_.has(moves[i], 'forks')) {
                forkPoint[i] = 0;
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

    }

    /**
     * 指し手オブジェクトを棋譜リストコンポーネント上で扱いやすいオブジェクトに変換して返す
     * 
     * @param move: 指し手オブジェクト
     * 
     * @return Object
     */
    public convertMoveListObject(move: Object){
        //この中で7六歩のような文字列表現も作成する
    }
}
