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
    public board;
    
    // 持ち駒の情報 [0]は先手、[1]は後手
    public hands;

    // 現在の指し手についているコメント
    public comment;

    // 初期の盤面配列
    private initBoard;

    // 初期の持ち駒
    private initHands;

    // 現在の手番 先手or後手
    private color;

    // 現在の指し手番号
    private _moveNum;

    // movesから作成した現在の指し手配列
    private moveArray;

    // 指し手の配列
    private moves;

    // 編集モードかどうか
    private mode;

    constructor(jkfData: Object, mode: number) {

        this.mode = mode;

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

        this.comment = '';

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
        this.board = _.cloneDeep(this.initBoard);
        this.hands = _.cloneDeep(this.initHands);


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
        if(this._moveNum !== moveNum){

        }else{
            return;
        }
    }

    /**
     * 現在の指し手番号を返す
     * 
     * 
     * @return number
     */
    public get moveNum(): number {
        return this._moveNum;
    }
}
