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
 * 棋譜のポイントクラス
 */
class KifuPos {
    public x: number;
    public y: number;

    constructor(X: number, Y: number) {
        this.x = X;
        this.y = Y;
    }

    public reverse(): KifuPos {
        return new KifuPos(10 - this.x, 10 - this.y);
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

    // 元の指し手オブジェクト
    private move: Object;

    /**
     * ボードの情報を返す
     * 
     * @param move: 入力された指し手オブジェクト
     * @param isFork: 分岐する指し手かどうか
     * 
     */
    constructor(move: Object, fork: boolean = false) {
        this.move = move;

        this.moveName = this.getMoveName(move);

        this.fork = fork;

        this.comments = _.has(move, 'comments') ? move['comments'] : null;

        if (this.comments) {
            this.comment = '';
            _.map(this.comments, (comment) => {
                this.comment += comment;
            });
        } else {
            this.comment = '';
        }

        this.isPut = false;

        // 初期盤面の場合、次の手が先手の手番となるので、後手の手としておく
        this.color = 1;

        // 指し手情報をもつか判定
        if (_.has(move, 'move')) {

            // 持ち駒から置く手かどうか判定
            if (_.has(move['move'], 'from')) {
                this.from = move['move']['from'];
            } else {
                this.isPut = true;
            }

            // 持ち駒から置く手かどうか判定
            if (_.has(move['move'], 'to')) {
                this.to = move['move']['to'];
            } else {
                throw new KifuDataError('move Object do not have "to" property');
            }

            // プレイヤー情報をセット
            if (_.has(move['move'], 'color')) {
                this.color = move['move']['color'];
            } else {
                throw new KifuDataError('not defined player info');
            }

            // 駒情報をセット
            if (_.has(move['move'], 'piece')) {
                this.kind = move['move']['piece'];
            } else {
                throw new KifuDataError('not defined piece info');
            }

            // 成るかどうか判定
            if (_.has(move['move'], 'promote')) {
                this.isPromote = move['move']['promote'];
            } else {
                this.isPromote = false;
            }

            // 「同」がつくか判定
            if (_.has(move['move'], 'same')) {
                this.isSame = move['move']['same'];
            } else {
                this.isSame = false;
            }

            // 駒を取ったか判定
            if (_.has(move['move'], 'capture')) {
                this.capture = move['move']['capture'];
            } else {
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
        if (_.has(move, 'move')) {
            if (_.has(move['move'], 'to') && _.has(move['move'], 'color') && _.has(move['move'], 'piece')) {
                const moveInfo = move['move'];

                // 駒名の文字列
                let komaString = SHOGI.Info.getKanji(SHOGI.Info.komaAtoi(moveInfo['piece']));

                // 成る場合「成」を駒名に追加
                if (_.has(moveInfo, 'promote')) {
                    komaString = (moveInfo['promote']) ? komaString + '成' : komaString;
                }

                // 先手or後手の文字列
                const turnString = (moveInfo['color'] === 0) ? '☗' : '☖';

                // 指し手位置の文字列
                let moveString = '同';
                if (!_.has(moveInfo, 'same')) {
                    // 前の手と異なる位置への指し手

                    // 数字の漢字
                    const kanjiNum: Array<string> = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

                    // 駒の移動先座標の文字列
                    moveString = moveInfo['to']['x'] + kanjiNum[moveInfo['to']['y']];
                }

                // 相対情報を駒名に付加
                if (!_.has(moveInfo, 'relative')) {
                    const relativeString = moveInfo['relative'];

                    switch (relativeString) {
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
            } else {
                throw new KifuDataError('move to property not defined');
            }
        } else {
            return '初期局面';
        }
    }

    /**
     * コメントを元の指し手配列に対してセットする
     * 
     * @param comment 
     */
    public setComment(comment: string) {
        if(_.has(this.move, 'comments')) {
            this.move['comments'][0] = comment;
        }else {
            this.move['comments'] = [];
            this.move['comments'][0] = comment;
        }

        this.comment = comment;
    }
}

/**
 * 現在の盤面データを表すクラス
 */
export default class KifuData {
    // 定跡 or 棋譜
    public listmode;

    // 盤面の表示配列 (盤面へはメソッドを介してアクセスする)
    private _board: Array<Array<Object>>;

    // 持ち駒の情報 [0]は先手、[1]は後手
    private _hands;

    // movesから作成した現在の指し手配列
    private _moveArray: Array<MoveInfo | { [key: number]: MoveInfo; }>;

    // 現在の各分岐点における分岐インデックスの配列
    private forkPoints: { [key: number]: number; };

    // 初期の盤面配列
    private initBoard;

    // 初期の持ち駒
    private initHands;

    // 現在の手番 先手or後手
    public color;

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
        if (_.has(jkfData, 'moves')) {
            this.initMoves = jkfData['moves'];
        } else {
            this.initMoves = [];
        }

        this.moves = _.cloneDeep(this.initMoves);

        this.forkPoints = {};
        // 全てのforkを0として初期の分岐を作成
        this.makeInitialMove();

        // TODO: ここの判断はjkfのヘッダ情報を利用する？
        if (this.forkPoints === {}) {
            this.listmode === SHOGI.LIST.KIFU;
        } else {
            this.listmode === SHOGI.LIST.ZYOSEKI;
        }

        // 平手状態
        this.initBoard =
            [
                [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
                [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
            ];
        this.initHands = [{}, {}];
        this.color = 0;

        // 初期の指し手
        this._moveNum = 0;

        // 特殊な初期状態が登録されているか判定
        if (_.has(jkfData, 'initial')) {
            // 特殊初期状態

            // プリセットが未定義ならエラー
            if (!_.has(jkfData['initial'], 'preset')) {
                throw new KifuDataError('jkf preset not defined');
            } else {
                switch (jkfData['initial']['preset']) {
                    case 'HIRATE':  // 平手
                        // 平手は代入済
                        break;
                    case 'KY':     // 香落ち
                        this.initBoard =
                            [
                                [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, {}],
                                [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case 'KY_R':     // 右香落ち
                        this.initBoard =
                            [
                                [{}, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
                                [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case 'KA':     // 角落ち
                        this.initBoard =
                            [
                                [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
                                [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case 'HI':     // 飛車落ち
                        this.initBoard =
                            [
                                [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
                                [{}, {}, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case 'HIKY':  // 飛香落ち
                        this.initBoard =
                            [
                                [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, {}],
                                [{}, {}, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case '2':  // 2枚落ち
                        this.initBoard =
                            [
                                [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case '4':  // 4枚落ち
                        this.initBoard =
                            [
                                [{}, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case '6':  // 6枚落ち
                        this.initBoard =
                            [
                                [{}, {}, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case '8':  // 8枚落ち
                        this.initBoard =
                            [
                                [{}, {}, {}, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case '10':  // 10枚落ち
                        this.initBoard =
                            [
                                [{}, {}, {}, {}, { color: 1, kind: 'OU' }, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{}, {}, {}, {}, {}, {}, {}, {}, {}],
                                [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
                                [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
                                [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
                            ];
                        break;
                    case 'OTHER':  // その他
                        if (_.has(jkfData['initial'], 'data')) {
                            // 初期盤面のセット
                            if (_.has(jkfData['initial']['data'], 'board')) {
                                this.initBoard = _.cloneDeep(jkfData['initial']['data']['board']);
                            } else {
                                // otherプリセット用の初期盤面データがない場合はエラー
                                throw new KifuDataError('jkf OTHER preset board not defined');
                            }

                            // 初期持ち駒のセット
                            if (_.has(jkfData['initial']['data'], 'hands')) {
                                this.initHands = _.cloneDeep(jkfData['initial']['data']['hands']);
                            }

                            // 初期手番のセット
                            if (_.has(jkfData['initial']['data'], 'color')) {
                                this.color = jkfData['initial']['data']['color'];
                            }
                        } else {
                            // otherプリセット用の初期データがない場合はエラー
                            throw new KifuDataError('jkf OTHER preset data not defined');
                        }
                        break;
                    default:
                        // 該当のプリセットなし
                        throw new KifuDataError('jkf preset not found');
                }
            }
        } else {
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
        if (_.has(this.forkPoints, moveNum)) {
            return <MoveInfo>this._moveArray[moveNum][this.forkPoints[moveNum]];
        } else {
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
    public getForkList(forkNum: number): { [key: number]: MoveInfo; } {
        if (_.has(this.forkPoints, forkNum)) {
            return this._moveArray[forkNum] as { [key: number]: MoveInfo; };
        } else {
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
        // TODO: 分岐を持つ指し手の削除時にエラー発生?
        if (_.has(this.forkPoints, moveNum)) {
            console.log('[moveArray in getForkMove]', this._moveArray);
            return <MoveInfo>this._moveArray[moveNum][forkNum];
        } else {
            throw new KifuDataError('_moveArray[forkNum] is not Array');
            //return <MoveInfo>this._moveArray[moveNum];
        }
    }

    /**
     * 新たな指し手を追加 (EditMode用)
     * 
     */
    public setMove() {
        if (this.mode === SHOGI.MODE.EDIT) {

        } else {
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
        if (this._moveNum !== updateNum && updateNum >= 0 && updateNum < this.moveArray.length) {
            // _boardと_hands、_moveNumが更新の対象
            if (this._moveNum > updateNum) {
                // 更新後の指し手が現在の指し手より小さい場合(手を戻す)
                let tmpMoveNum = this._moveNum;

                while (tmpMoveNum > updateNum) {
                    // 盤面と持ち駒の更新処理

                    // 次に適用する指し手
                    const applyMove = this.getMove(tmpMoveNum);

                    let color = applyMove.color;

                    // 持ち駒から置く手かどうか判定
                    if (applyMove.isPut) {
                        let to = applyMove.to;

                        // 駒を配置
                        this.setBoardPiece(to['x'], to['y'], {});

                        // 持ち駒を増やす
                        this.addHand(color, applyMove.kind);
                    } else {
                        let from = applyMove.from;
                        let to = applyMove.to;

                        let kind = applyMove.kind;

                        // 元の駒の位置を空に
                        this.setBoardPiece(to['x'], to['y'], {});

                        // 駒を移動
                        this.setBoardPiece(from['x'], from['y'], { color: color, kind: kind });

                        // 駒を取っていた場合の戻し処理
                        if (applyMove.capture) {
                            let capture = applyMove.capture;

                            // 取っていた駒を盤に配置
                            this.setBoardPiece(to['x'], to['y'], { color: (1 - color), kind: capture });

                            // 持ち駒から駒を減らす
                            let hand = (SHOGI.Info.getOrigin(capture)) ? SHOGI.Info.getOrigin(capture) : capture;
                            this.deleteHand(color, hand);
                        }
                    }

                    // 次に行動するプレイヤーをセット
                    this.color = color;

                    tmpMoveNum--;
                }
            } else
                if (this._moveNum < updateNum) {
                    // 更新後の指し手が現在の指し手より小さい場合(手を進める)
                    let tmpMoveNum = this._moveNum;

                    while (tmpMoveNum < updateNum) {
                        // 盤面と持ち駒の更新処理

                        // 次に適用する指し手
                        const applyMove = this.getMove(tmpMoveNum + 1);

                        let color = applyMove.color;

                        // 持ち駒から置く手かどうか判定
                        if (applyMove.isPut) {
                            let to = applyMove.to;

                            // 駒を配置
                            this.setBoardPiece(to['x'], to['y'], { color: color, kind: applyMove.kind });

                            // 持ち駒から駒を減らす
                            this.deleteHand(color, applyMove.kind);
                        } else {
                            let from = applyMove.from;
                            let to = applyMove.to;

                            let kind = (applyMove.isPromote) ? SHOGI.Info.getPromote(applyMove.kind) : applyMove.kind;

                            // 元の駒の位置を空に
                            this.setBoardPiece(from['x'], from['y'], {});

                            // 駒を移動
                            this.setBoardPiece(to['x'], to['y'], { color: color, kind: kind });

                            // 駒を取った場合の処理
                            if (applyMove.capture) {
                                let capture = (SHOGI.Info.getOrigin(applyMove.capture)) ? SHOGI.Info.getOrigin(applyMove.capture) : applyMove.capture;

                                this.addHand(color, capture);
                            }
                        }

                        // 次に行動するプレイヤーをセット
                        this.color = 1 - color;

                        tmpMoveNum++;
                    }
                } else {
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

        return _.map(_.reverse(board), (boardRow) => {
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
    public isFocus(x: number, y: number, reverse: boolean = false): boolean {
        if (this._focus) {
            if (!_.has(this._focus, 'x') || !_.has(this._focus, 'y')) {
                throw new KifuDataError('focusオブジェクトのプロパティが不足しています。');
            }

            const pos = this.posToKifupos(x, y);
            const rPos = pos.reverse();

            const focusPos = new KifuPos(this._focus['x'], this._focus['y']);

            if (!(reverse) && focusPos.x === pos.x && focusPos.y === pos.y) {
                return true;
            } else if (reverse && focusPos.x === rPos.x && focusPos.y === rPos.y) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * 指定座標に移動時に成れるかを返す
     * 
     * @param komaType: 駒番号
     * @param x: x座標
     * @param y: y座標
     * @param owner: 移動駒の持ち主
     * @param reverse: 反転状態で判定するかどうか
     * 
     * @return boolean
     */
    public isPromotable(komaType: number,fromX: number, fromY: number, toX: number, toY: number, owner: number): boolean {

        // 成れない駒の場合はfalse
        if (!SHOGI.Info.getPromote(SHOGI.Info.komaItoa(komaType))) {
            return false;
        }

        if (owner === SHOGI.PLAYER.SENTE) {
            if (toY <= 2 || fromY <= 2) {
                return true;
            } else {
                return false;
            }
        } else if (owner === SHOGI.PLAYER.GOTE) {
            if (toY >= 6 || fromY >= 6) {
                return true;
            } else {
                return false;
            }
        } else {
            throw new KifuDataError('成・不成判断のエラーです。');
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
    private addHand(player: number, komaString: string) {
        if (_.has(this._hands, player)) {
            if (_.has(this._hands[player], komaString)) {
                this._hands[player][komaString]++;
            } else {
                this._hands[player][komaString] = 1;
            }
        } else {
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
    private deleteHand(player: number, komaString: string) {
        if (_.has(this._hands, player)) {
            if (_.has(this._hands[player], komaString)) {
                this._hands[player][komaString]--;
            } else {
                throw new KifuDataError('illigal komaString number');
            }
        } else {
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
    public get moveArray(): Array<MoveInfo | { [key: number]: MoveInfo; }> {
        return this._moveArray;
    }

    /**
     * 現在の指し手配列に新たな指し手を追加
     * 
     * @param moves: 追加する指し手配列
     * 
     * @return number
     */
    private moveArrayAdd(moves) {
        let forkArray: { [key: number]: MoveInfo; } = null;
        let forkNum = 1;

        const moveLength = moves.length;

        // forkPointsを更新する際に使う
        const addPoint = _.size(this._moveArray);

        for (let i = 0; i < moveLength; i++) {
            const isFork = _.has(moves[i], 'forks');

            if (!isFork) {
                this._moveArray.push(new MoveInfo(moves[i], false));
            } else {
                forkArray = {};

                forkArray[0] = new MoveInfo(moves[i], true);

                // 初期の分岐はひとつめのものを使う
                this.forkPoints[addPoint + i] = 0;

                forkNum = 1;
                _.each(moves[i]['forks'], (forkMove) => {
                    forkArray[forkNum] = new MoveInfo(forkMove[0], true);
                    forkNum++;
                });

                this._moveArray.push(_.cloneDeep(forkArray));
            }
        }
    }

    /**
     * 指定された番号以降の指し手を指し手配列から削除
     * 
     * @param moveNum: 指し手番号
     * @param forkNum: 分岐番号
     * 
     * @return number
     */
    public moveArrayDelete(moveNum: number,forkNum: number = null) {
        if(_.isNumber(forkNum)) {
            if(forkNum !== 0) {
                // _moveArrayを更新
                _.unset(this._moveArray[moveNum], forkNum.toString());
                if(_.isObject(this._moveArray[moveNum])) {
                    if(_.size(this._moveArray[moveNum] as {[key: number]: MoveInfo}) === 1) {
                        const moveInfo = this._moveArray[moveNum][0] as MoveInfo;
                        moveInfo.fork = false;
                        this._moveArray[moveNum] = moveInfo;

                        // forkPointsを修正
                        _.unset(this.forkPoints, moveNum);
                    }else {
                        // 削除でforkNumが飛び飛びになる場合
                        this._moveArray[moveNum] =
                        _.mapKeys(this._moveArray[moveNum] as {[key: number]: MoveInfo}, (value, key) => {
                            if(+key > forkNum) {
                                return (+key) - 1;
                            }else {
                                return key;
                            }
                        }) as {[key: number]: MoveInfo};
                    }
                }
            }
        }else {
            this._moveArray = _.slice(this._moveArray, 0, (moveNum + 1));
        }
    }

    /**
     * 指定された番号に指定の指し手の選択肢を追加
     * 
     * @param moveNum: 指し手番号
     * @param move: 追加する指し手
     * 
     * @return number
     */
    public moveArrayForkAdd(moveNum: number, move: Object, forkIndex: number) {
        const addTarget = this._moveArray[moveNum];
        if(_.has(addTarget,'0')) {
            // すでに選択肢を持つ
            addTarget[forkIndex] = new MoveInfo(move, true);
        }else {
            // 選択肢を持たない
            const originMoveInfo: MoveInfo = _.cloneDeep(addTarget) as MoveInfo;
            originMoveInfo.fork = true;

            const addMoveInfo: MoveInfo = new MoveInfo(move, true);
            this._moveArray[moveNum] = {0:originMoveInfo, 1:addMoveInfo};

            console.log('[moveArray modify]', this._moveArray[moveNum]);
        }

        console.log(['moveArray in moveArrayForkAdd'], this._moveArray);
    }

    // TODO: moveオブジェクトを作成する
    public makeMoveData(komaType: number, fromX: number, fromY: number, toX: number, toY: number, promote: boolean): Object {

        // 前の指し手を取得
        const prevMove = this.getMove(this.moveNum);

        // 手番のプレイヤーを取得
        const color = 1 - prevMove.color;

        const moveObj = {};
        const moveInfoObj = {};

        moveObj['move'] = moveInfoObj;

        const toPos = this.posToKifupos(toX, toY);
        const fromPos = this.posToKifupos(fromX, fromY);

        moveInfoObj['to'] = { x: toPos.x, y: toPos.y };
        moveInfoObj['color'] = color;
        moveInfoObj['piece'] = SHOGI.Info.komaItoa(komaType);

        if (fromX != null && fromY != null) {
            // 盤面の駒を動かす場合
            moveInfoObj['from'] = { x: fromPos.x, y: fromPos.y };

            // TODO:komaTypeと答え合わせする？
        } else {
            // 持ち駒を置く場合
        }

        // 成る場合promoteプロパティを追加
        if (promote) {
            moveInfoObj['promote'] = true;
        }

        // 前の指し手と同じ位置に移動する場合sameプロパティを追加
        if (prevMove.to) {
            if (prevMove.to['x'] === toPos.x && prevMove.to['y'] === toPos.y) {
                moveInfoObj['same'] = true;
            }
        }

        // 移動先に駒が存在する場合captureプロパティを追加
        const toPosObj = this.getBoardPiece(toPos.x, toPos.y);
        if (!_.isEmpty(toPosObj)) {
            if (_.has(toPosObj, 'kind')) {
                if (toPosObj['color'] === color) {
                    throw new KifuDataError('自分の駒を取る移動です。');
                }
                moveInfoObj['capture'] = toPosObj['kind'];
            }
        }

        return moveObj;
    }

    // TODO: 該当の指し手データを追加する
    public moveAdd(komaType: number, fromX: number, fromY: number, toX: number, toY: number, promote: boolean, fork: boolean = false) {
        // 新規の指し手オブジェクトを作成
        const moveObj = this.makeMoveData(komaType, fromX, fromY, toX, toY, promote);

        const moveNum = this.moveNum;

        let basePos = 0;
        let skipFlag = false;

        // 指し手を挿入するべきオブジェクトを入れる変数
        let tmpMoveObj:Array<Object> = this.moves;

        _.each(this.forkPoints, (forkNum, forkPos) => {
            if ((+forkPos) > moveNum) {
                skipFlag = true;
            }

            if (!skipFlag && forkNum) {
                const pos = +forkPos;
                tmpMoveObj = tmpMoveObj[pos - basePos]['forks'][(+forkNum - 1)];
                basePos = pos;
            }
        });

        // 分岐の部分配列上のインデックス
        let addIndex = moveNum - basePos;
        if(addIndex !== (tmpMoveObj.length - 1) && !fork) {
            throw new KifuDataError('分岐でない場合、最後尾以外に指し手を追加できません。');
        }

        // 新規の指し手をmovesに追加
        if(fork) {
            // 分岐の場合はforkに追加
            addIndex ++;

            const addTargetObj = tmpMoveObj[addIndex];

            if(!_.has(addTargetObj, 'forks')) {
                addTargetObj['forks'] = [];    
            }

            const fork = addTargetObj['forks'] as Array<Array<Object>>;

            fork.push([moveObj]);

            // moveArrayを修正
            this.moveArrayForkAdd((this.moveNum + 1), moveObj, (fork.length));

            // 作成した分岐にスイッチ
            this.switchFork((this.moveNum + 1), (fork.length));

            // 新規作成の手に指し手を進める
            this.moveNum ++;
        }else {
            // 分岐でない場合は最後尾に追加
            tmpMoveObj.push(moveObj);

            // 指し手オブジェクトの更新
            this.moveArrayAdd([moveObj]);

            // 新規作成の手に指し手を進める
            this.moveNum ++;
        }
    }

    // TODO: 最後尾の指し手データを削除する
    public moveDelete() {
        console.log('moveDelete');
        // 消す手の直前に指し手を戻す
        this.moveNum--;

        const moveNum = this.moveNum;

        // 大元moves配列の分岐が発生した要素のインデックス
        let basePos = 0;
        let skipFlag = false;

        // 指し手削除対象のオブジェクトを入れる変数
        let tmpMoveObj:Array<Object> = this.moves;

        // tmpObjectに該当オブジェクトの分岐が含まれるオブジェクト配列を代入
        _.each(this.forkPoints, (forkNum, forkPos) => {
            if ((+forkPos) > moveNum) {
                skipFlag = true;
            }

            if (!skipFlag && forkNum) {
                const pos = +forkPos;
                tmpMoveObj = tmpMoveObj[pos - basePos]['forks'][(+forkNum - 1)];
                basePos = pos;
            }
        });

        // 対象オブジェクトが分岐をもたない場合、最後尾のオブジェクトを削除
        tmpMoveObj.pop();

        // 指し手オブジェクトの更新
        this.moveArrayDelete((this.moveArray.length - 2));
    }

    // TODO: 各オブジェクトを_.hasでチェックするバリデーションチェック用関数を作る？

    /**
     * 盤面の指定した駒の移動可能箇所を返す
     * 
     * @param x: boardのx座標
     * @param y: boardのy座標
     * @param movePlayer: 行動するプレイヤー
     * @param komaType: 配置する駒 持ち駒から置く場合は必須
     * 
     * @return Array<Array<number>>;
     *
     */
    public makeMoveArea(x: number, y: number, movePlayer: number, komaType: number, reverse: boolean = false): Array<Array<number>> {
        // TODO: 自殺禁止

        let area: Array<Array<number>> = [
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

        if (_.isNumber(x) && _.isNumber(y)) {
            // 盤面の駒の移動の場合

            const targetKoma = this._board[y][x];

            if (targetKoma === {}) {
                return area;
            }

            const color = targetKoma['color'];

            //移動対象の駒座標
            const pos = new KifuPos(x, y);

            if (targetKoma['kind'] != SHOGI.Info.komaItoa(komaType)) {
                throw new KifuDataError('盤面の駒と移動対象駒が一致しません。');
            }

            const komaMoves = SHOGI.Info.getMoves(SHOGI.Info.komaAtoi(targetKoma['kind']));

            _.each(komaMoves, (move) => {
                // 駒の動きをひとつずつ検討し、areaを確定する
                let mx = move['x'];
                let my = move['y'];


                if (!color) {
                    // 先手の場合
                    my *= (-1);
                } else {
                    // 後手の場合
                    mx *= (-1);
                }

                switch (move['type']) {
                    case 'pos':
                        if (this.inRange(pos.y + my, pos.x + mx)) {
                            if (_.isEmpty(this._board[pos.y + my][pos.x + mx])) {
                                area[pos.y + my][pos.x + mx] = 1;
                            } else {
                                if (this._board[pos.y + my][pos.x + mx]['color'] != color) {
                                    area[pos.y + my][pos.x + mx] = 1;
                                }
                            }
                        }
                        break;
                    case 'dir':
                        let movable = true;
                        let nextX = pos.x;
                        let nextY = pos.y;

                        while (movable) {
                            nextX += mx;
                            nextY += my;
                            if (this.inRange(nextY, nextX)) {
                                if (_.isEmpty(this._board[nextY][nextX])) {
                                    area[nextY][nextX] = 1;
                                } else {
                                    if (this._board[nextY][nextX]['color'] != color) {
                                        area[nextY][nextX] = 1;
                                    }

                                    movable = false;
                                }
                            } else {
                                movable = false;
                            }
                        }
                        break;
                    default:
                        throw new KifuDataError('未知の移動タイプです。');
                }
            })
        } else {
            // 持ち駒を置く場合

            // emptyな場所にのみ配置できる
            _.each(area, (areaRow, y) => {
                _.each(areaRow, (movable, x) => {
                    if (this.canSet(x, y, komaType, movePlayer)) {
                        area[y][x] = 1;
                    }
                })
            })
        }

        if (reverse) {
            return _.map(_.reverse(area), (areaRow) => {
                return _.reverse(areaRow as Array<number>) as Array<number>;
            });
        } else {
            return area;
        }
    }

    /**
     * 現在の盤面で移動可能な駒の一覧を返す
     * 
     * @return Array<Array<number>>;
     *
     */
    public makeMovableKomaArea(reverse: boolean = false): Array<Array<number>>  {
        let area: Array<Array<number>> = [
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

        _.each(this.board, (boardRow, y) => {
            _.each(boardRow, (koma, x) => {

                if(!_.isEmpty(koma)) {
                    // 手番のプレーヤーが持つ駒だけが移動可能判定対象
                    if(koma['color'] === this.color) {
                        //配置対象の駒座標
                        const pos = new KifuPos(x, y);

                        // 駒の移動配列
                        const komaMoves = SHOGI.Info.getMoves(SHOGI.Info.komaAtoi(koma['kind']));

                        const movable = 
                        _.some(komaMoves, (move) => {
                            let mx = move['x'];
                            let my = move['y'];

                            if (!this.color) {
                                // 先手の場合
                                my *= (-1);
                            } else {
                                // 後手の場合
                                mx *= (-1);
                            }

                            // 移動タイプにかかわらずx,yで判定すればよい
                            if (this.inRange(pos.y + my, pos.x + mx)) {
                                const toKoma = this._board[pos.y + my][pos.x + mx];
                                if(!_.isEmpty(toKoma)) {
                                    if(toKoma['color'] !== this.color) {
                                        return true;
                                    }
                                }else{
                                    return true;
                                }
                            }

                            return false;
                        });

                        if(movable) {
                            area[y][x] = 1;
                        }
                    }
                }
            })
        });

        if (reverse) {
            return _.map(_.reverse(area), (areaRow) => {
                return _.reverse(areaRow as Array<number>) as Array<number>;
            });
        } else {
            return area;
        }
    }

    // x,yが範囲内かどうか調べる
    private inRange(x: number, y: number): boolean {
        if (x >= 0 && x < 9 && y >= 0 && y < 9) {
            return true;
        } else {
            return false;
        }
    }

    /**
    * 駒を指定地点に配置可能かどうかを判定
    * 
    * @param posX: 配置X座標
    * @param posY: 配置Y座標
    * @param komaType: 駒番号
    * @param color: 手番のプレイヤー
    * 
    */
    private canSet(posX: number, posY: number, komaType: number, color: number): boolean {

        const komaMoves = SHOGI.Info.getMoves(komaType);

        // 配置場所がemptyでないならその時点でfalse
        if(!_.isEmpty(this._board[posY][posX])) {
            return false;
        }

        //配置対象の駒座標
        const pos = new KifuPos(posX, posY);

        // 駒の動きをひとつずつ検討し、ひとつでも移動可能を検知したらtrueを返す
        const canset =
        _.some(komaMoves, (move) => {
            let mx = move['x'];
            let my = move['y'];


            if (!color) {
                // 先手の場合
                my *= (-1);
            } else {
                // 後手の場合
                mx *= (-1);
            }

            if (this.inRange(pos.y + my, pos.x + mx)) {
                if(komaType !== SHOGI.KOMA.FU) {
                    // 移動タイプにかかわらずx,yで判定すればよい
                    return true;
                }else {
                    // 歩の場合二歩判定
                    // TODO: 相手の駒も判定してしまう問題を改善
                    const settable =
                    _.every(this._board,(boardRow) => {
                        const sameColKoma = boardRow[pos.x];
                        if(_.isEmpty(sameColKoma)) {
                            return true;
                        }else {
                            if(sameColKoma['kind'] === SHOGI.Info.komaItoa(SHOGI.KOMA.FU)) {
                                return false;
                            }else {
                                return true;
                            }
                        }
                    });

                    return settable;
                }
            }

            return false;
        });

        return canset;
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
        if (this.moveNum === moveNum && forkNum === this.forkPoints[moveNum]) {
            return;
        }

        // moveNumが0ならエラーを出す
        if (moveNum <= 0) {
            throw new KifuDataError('初期盤面では棋譜分岐できません。');
        }

        // 現在の指し手が分岐後のものの場合指し手を戻す
        let moveLeap: boolean = false;
        if (this.moveNum >= moveNum) {
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

        if (forkNum !== 0) {
            // ループ対象となる指し手オブジェクトを代入
            const targetMoveArray = this.getForkMoveObj(moveNum);

            // 指し手オブジェクトの更新
            this.moveArrayAdd(targetMoveArray);
        } else {
            // 通常分岐に戻る場合はmakeInitalMoveと同様の処理
            const targetMoveArray = this.getForkMoveObj(moveNum, true);

            // 指し手オブジェクトの更新
            this.moveArrayAdd(targetMoveArray);
        }

        // 手を戻っている場合分岐地点に指し手を進める
        if (moveLeap) {
            this.moveNum++;
        }
    }

    /**
     * 指定指し手番号の分岐番号を取得
     * 
     * @param moveNum 
     * @param forkNum 
     */
    public getFork(moveNum: number): number {
        if(_.has(this.forkPoints, moveNum)) {
            return this.forkPoints[moveNum];
        }else {
            return -1;
        }
    }

    /**
     * 分岐を削除する
     * 
     * @param moveNum: 指し手番号
     * @param forkNum: 分岐番号
     * 
     */
    public deleteFork(moveNum: number, forkNum: number) {
        // _board,_hands,forkPoints,_moveArrayが更新対象

        // moveNumが0ならエラーを出す
        if (moveNum <= 0) {
            throw new KifuDataError('初期盤面では棋譜分岐できません。');
        }

        // forkNumが0ならエラーを出す
        if (forkNum <= 0) {
            throw new KifuDataError('主分岐は削除できません。');
        }

         // forkPointsの値修正を行う
        if(this.forkPoints[moveNum] >= forkNum) {
            this.forkPoints[moveNum] --;
        }

        //const edgeData = this.getEdgeMoveObjData(moveNum);
        const edgeData = this.getOriginMoveObjData(moveNum);
        const targetMoveObj = edgeData['moveObj'];
        const basePos = edgeData['basePos'];
        const targetPos = moveNum - basePos;

        // ここでforksのインデックスの修正
        console.log('[forkNum]', forkNum);
        _.pullAt(targetMoveObj[targetPos]['forks'], (forkNum - 1));
        if(_.isEmpty(targetMoveObj[targetPos]['forks'])) {
            // 分岐指し手プロパティの削除
            _.unset(targetMoveObj[targetPos],'forks');

            // 分岐ポイントの削除
            _.unset(this.forkPoints, moveNum);
        }

        //TODO: 分岐が消える場合forkPointsの削除処理

        // 指し手配列を削除
        this.moveArrayDelete(moveNum, forkNum);
        console.log('[moveArray in deleteFork]', this.moveArray);
        console.log('[moves in deleteFork]',this.moves);
        console.log('[forkPoints in deleteFork]',this.forkPoints);
    }

    /**
     * その指し手番号を含む指し手配列を分岐として持つ指し手配列を返す
     * 
     * @param moveNum: 分岐を持つ指し手番号
     * 
     * @return Object
     * 
     */
    private getOriginMoveObjData(moveNum: number) {
        let moveCount = 0;
        let basePos = 0;
        let skipFlag = false;

        let tmpMoveObj = this.moves;

        _.each(this.forkPoints, (forkNum, forkPos) => {
            if ((+forkPos) > moveNum) {
                skipFlag = true;
            } else {
                moveCount = (+forkPos);
            }

            if (!skipFlag && forkNum) {
                const pos = +forkPos;
                if(moveCount !== moveNum) {
                    tmpMoveObj = tmpMoveObj[pos - basePos]['forks'][(+forkNum - 1)];
                    basePos = pos;
                }

            }
        });

        // moveObj: 指し手番号で指定されたデータを含む指し手配列
        // basePos: 渡した指し手配列の開始地点が何番目の指し手に相当するかを表す番号
        return {'moveObj':tmpMoveObj, 'basePos':basePos};
    }

    /**
     * その指し手番号を含む指し手配列の最小分岐を返す
     * 
     * @param moveNum: 分岐を持つ指し手番号
     * 
     * @return Object
     * 
     */
    private getEdgeMoveObjData(moveNum: number) {
        let moveCount = 0;
        let basePos = 0;
        let skipFlag = false;

        let tmpMoveObj = this.moves;

        _.each(this.forkPoints, (forkNum, forkPos) => {
            if ((+forkPos) > moveNum) {
                skipFlag = true;
            } else {
                moveCount = (+forkPos);
            }

            if (!skipFlag && forkNum) {
                const pos = +forkPos;
                tmpMoveObj = tmpMoveObj[pos - basePos]['forks'][(+forkNum - 1)];
                basePos = pos;
            }
        });

        // moveObj: 指し手番号で指定されたデータを含む指し手配列
        // basePos: 渡した指し手配列の開始地点が何番目の指し手に相当するかを表す番号
        return {'moveObj':tmpMoveObj, 'basePos':basePos};
    }

    /**
     * 分岐変更によって追加される指し手配列を返す
     * 
     * @param moveNum: 分岐を持つ指し手番号
     * @param major:   主分岐の取得かどうか
     * 
     * @return Object
     * 
     */
    private getForkMoveObj(moveNum: number, major: boolean = false) {
        const edgeData = this.getEdgeMoveObjData(moveNum)
        const tmpMoveObj = edgeData['moveObj'];
        const basePos = edgeData['basePos'];

        if (major) {
            return _.slice(tmpMoveObj, (moveNum - basePos + 1));
        } else {
            return _.slice(tmpMoveObj, 1);
        }
    }

    // TODO: リファクタ switchFork前にmoveArrayを直接いじる必要がないようにする
    // TODO: 重複棋譜の入力を除外する処理の追加
    // TODO: movesのコメントが変更されているか確認
}
