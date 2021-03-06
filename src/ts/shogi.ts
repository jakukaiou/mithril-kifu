import * as _ from 'lodash';

// 将棋用語等の定数定義、および将棋ルールによる定義値を返す変数、関数群を扱うネームスペース

// 先手、後手
export const PLAYER = {
    SENTE: 0,
    GOTE : 1
};

// プレイヤーのモード
export const MODE = {
    VIEW: 0,      // 閲覧モード
    EDIT: 1,      // 編集モード
    CREATE: 2,    // 新規作成モード
    PLAY: 3       // プレイモード
};

// 棋譜のタイプ
export const LIST = {
    KIFU   : 0,
    JOSEKI : 1
};

// 駒の種類
export const KOMA = {
    NONE : 0,   // 駒なし
    FU   : 1,   // 歩
    KY   : 2,   // 香
    KE   : 3,   // 桂
    GI   : 4,   // 銀
    KI   : 5,   // 金
    KA   : 6,   // 角
    HI   : 7,   // 飛
    OU   : 8,   // 王

    TO   : 9,    // と
    NY   : 10,    // 成香
    NK   : 11,   // 成桂
    NG   : 12,   // 成銀
    UM   : 13,   // 馬
    RY   : 14    // 龍
};

// 盤面の種類
export const BAN = {
    HIRATE   : 0,
    KOMAOCHI : 1,
    CUSTOM   : 2
};

// 駒落ちの種類
export const KOMAOCHI = {
    KYO    : 0,
    KAKU   : 1,
    HISHA  : 2,
    HIKYO  : 3,
    NI     : 4,
    YON    : 5,
    ROKU   : 6,
    HACHI  : 7,
};

export class Util {

    /**
     * オブジェクトを分割して配列として返す
     * 
     * @param object: 分割するオブジェクト
     * @param chunkNum: 分割個数
     * 
     * @return Array
     */
    public static objChunk(object: Object, chunkNum: number) {
        const array = [];

        let count = 0;
        let tmpObj = null;

        _.each(object, (value, key) => {
            if(count === 0) {
                let partObj = {};
                tmpObj = partObj;
            }
            tmpObj[key] = value;
            
            count++;

            if(count === chunkNum) {
                array.push(tmpObj);
                tmpObj = null;
                count = 0;
            }
        });

        if(!_.isNull(tmpObj)) {
            array.push(tmpObj);
        }

        return array;
    }
}

export class Info {
    private static komaData: Array<Object> = [
        {

        },
        {
            // 歩
            name       : '歩',      // 略駒名
            fullName   : '歩兵',     // 駒名
            className  : 'fu',      // cssクラス中で使用する名前
            banName    : 'FU',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
            ],
            canPromote : true,      // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : KOMA.TO,   // 成り先
            devolveNum : null,      // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 香
            name       : '香',      // 略駒名
            fullName   : '香車',     // 駒名
            className  : 'kyo',     // cssクラス中で使用する名前
            banName    : 'KY',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'dir',
                    x    : 0,
                    y    : 1
                },
            ],
            canPromote : true,      // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : KOMA.NY,   // 成り先
            devolveNum : null,      // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 桂馬
            name       : '桂',      // 略駒名
            fullName   : '桂馬',     // 駒名
            className  : 'kei',     // cssクラス中で使用する名前
            banName    : 'KE',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 2
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 2
                },
            ],
            canPromote : true,      // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : KOMA.NK,   // 成り先
            devolveNum : null,      // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 銀
            name       : '銀',      // 略駒名
            fullName   : '銀将',     // 駒名
            className  : 'gin',     // cssクラス中で使用する名前
            banName    : 'GI',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : -1
                },
            ],
            canPromote : true,      // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : KOMA.NG,   // 成り先
            devolveNum : null,      // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 金
            name       : '金',      // 略駒名
            fullName   : '金将',     // 駒名
            className  : 'kin',     // cssクラス中で使用する名前
            banName    : 'KI',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : null,      // 成り先
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 角
            name       : '角',      // 略駒名
            fullName   : '角行',     // 駒名
            className  : 'kaku',    // cssクラス中で使用する名前
            banName    : 'KA',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'dir',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'dir',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'dir',
                    x    : -1,
                    y    : -1
                },
                {
                    type : 'dir',
                    x    : 1,
                    y    : -1
                },
            ],
            canPromote : true,      // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : KOMA.UM,   // 成り先
            devolveNum : null,      // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 飛車
            name       : '飛',      // 略駒名
            fullName   : '飛車',     // 駒名
            className  : 'hisha',   // cssクラス中で使用する名前
            banName    : 'HI',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'dir',
                    x    : 1,
                    y    : 0
                },
                {
                    type : 'dir',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'dir',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'dir',
                    x    : 0,
                    y    : -1
                },
            ],
            canPromote : true,      // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : KOMA.RY,   // 成り先
            devolveNum : null,      // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 王
            name       : '玉',      // 略駒名
            fullName   : '王将',     // 駒名
            className  : 'ou',      // cssクラス中で使用する名前
            banName    : 'OU',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : -1
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : false,     // 成り駒かどうか
            promoNum   : null,      // 成り先
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // と金
            name       : 'と',      // 略駒名
            fullName   : 'と金',     // 駒名
            className  : 'to',      // cssクラス中で使用する名前
            banName    : 'TO',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : true,      // 成り駒かどうか
            promoNum   : null,      // 成り先
            devolveNum : KOMA.FU,   // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 成香
            name       : '成香',     // 略駒名
            fullName   : '成香',     // 駒名
            className  : 'nkyo',    // cssクラス中で使用する名前
            banName    : 'NY',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : true,      // 成り駒かどうか
            promoNum   : null,      // 成り先
            devolveNum : KOMA.KY,   // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 成桂
            name       : '成桂',     // 略駒名
            fullName   : '成桂',     // 駒名
            className  : 'nkei',    // cssクラス中で使用する名前
            banName    : 'NK',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : true,      // 成り駒かどうか
            promoNum   : null,      // 成り先
            devolveNum : KOMA.KE,   // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 成銀
            name       : '成銀',     // 略駒名
            fullName   : '成銀',     // 駒名
            className  : 'ngin',    // cssクラス中で使用する名前
            banName    : 'NG',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : true,      // 成り駒かどうか
            promoNum   : null,      // 成り先
            devolveNum : KOMA.GI,   // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 馬
            name       : '馬',      // 略駒名
            fullName   : '竜馬',     // 駒名
            className  : 'uma',     // cssクラス中で使用する名前
            banName    : 'UM',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'dir',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'dir',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
                {
                    type : 'dir',
                    x    : 1,
                    y    : -1
                },
                {
                    type : 'dir',
                    x    : -1,
                    y    : -1
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : true,      // 成り駒かどうか
            promoNum   : null,      // 成り先
            devolveNum : KOMA.KA,   // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 龍
            name       : '龍',      // 略駒名
            fullName   : '龍王',     // 駒名
            className  : 'ryu',     // cssクラス中で使用する名前
            banName    : 'RY',      // 盤面情報での駒名
            moves      : [          // 進行方向定義 (posなら進行位置、dirなら進行方向)
                {
                    type : 'pos',
                    x    : -1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 0,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 1
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : 0
                },
                {
                    type : 'pos',
                    x    : 1,
                    y    : -1
                },
                {
                    type : 'pos',
                    x    : -1,
                    y    : -1
                },
                {
                    type : 'dir',
                    x    : 1,
                    y    : 0
                },
                {
                    type : 'dir',
                    x    : 0,
                    y    : 1
                },
                {
                    type : 'dir',
                    x    : -1,
                    y    : 0
                },
                {
                    type : 'dir',
                    x    : 0,
                    y    : -1
                },
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : true,      // 成り駒かどうか
            promoNum   : null,      // 成り先
            devolveNum : KOMA.HI,   // 成り元
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
    ];

    public static komaochiTypes:Array<string> = [
        '香落ち',
        '角落ち',
        '飛車落ち',
        '飛香落ち',
        '二枚落ち',
        '四枚落ち',
        '六枚落ち',
        '八枚落ち'
    ];

    public static hirateBoard:Array<Array<Object>> = [
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

    public static komaochiBoards:Array<Array<Array<Object>>> = [
        // 香落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
            [{}, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
        ],

        // 角落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, { color: 0, kind: 'HI' }, {}],
            [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
        ],

        // 飛車落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
        ],

        // 飛香落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, { color: 0, kind: 'KA' }, {}, {}, {}, {}, {}, {}, {}],
            [{}, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
        ],

        // 2枚落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'KY' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, { color: 0, kind: 'KY' }]
        ],

        // 4枚落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, { color: 0, kind: 'KE' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, { color: 0, kind: 'KE' }, {}]
        ],

        // 6枚落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, { color: 0, kind: 'GI' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, { color: 0, kind: 'GI' }, {}, {}]
        ],

        // 8枚落ち
        [
            [{ color: 1, kind: 'KY' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'OU' }, { color: 1, kind: 'KI' }, { color: 1, kind: 'GI' }, { color: 1, kind: 'KE' }, { color: 1, kind: 'KY' }],
            [{}, { color: 1, kind: 'HI' }, {}, {}, {}, {}, {}, { color: 1, kind: 'KA' }, {}],
            [{ color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }, { color: 1, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{ color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }, { color: 0, kind: 'FU' }],
            [{}, {}, {}, {}, {}, {}, {}, {}, {}],
            [{}, {}, {}, { color: 0, kind: 'KI' }, { color: 0, kind: 'OU' }, { color: 0, kind: 'KI' }, {}, {}, {}]
        ]
    ];

    
    /**
     * 駒の略称を返す
     * 
     * @param komaType: 駒の番号
     * 
     * @return String
     */
    public static getKanji(komaType: number): string {
        return this.komaData[komaType]['name'];
    }

    /**
     * 駒の動きの配列を返す
     * 
     * @param komaType: 駒の番号
     * 
     * @return Array
     */
    public static getMoves(komaType: number): Array<Object> {
        return this.komaData[komaType]['moves'];
    }

    /**
     * 駒のクラス名を返す
     * 
     * @param komaType: 駒の番号
     * @param owner: 駒の持ち主
     * 
     * @return Array
     */
    public static getClassName(komaType: number, owner: number, reverse: boolean): string {
        if(_.isUndefined(this.komaData[komaType]['className'])) {
            return '';
        }

        const ownerName = (reverse)? (owner === PLAYER.SENTE) ? 'oppo' : 'prop' : (owner === PLAYER.SENTE) ? 'prop' : 'oppo';
        return 'c-koma' + '_' + ownerName + '_' + this.komaData[komaType]['className'];
    }

    /**
     * 駒の成元を返す
     * 
     * @param komaType: 駒の番号
     * @param owner: 駒の持ち主
     * 
     * @return Array
     */
    public static getOrigin(komaString: string): string {
        if(this.komaData[this.komaAtoi(komaString)]['devolveNum']) {
            return this.komaData[this.komaData[this.komaAtoi(komaString)]['devolveNum']]['banName'];
        }else {
            return null;
        }
    }

    /**
     * 駒の成先を返す
     * 
     * @param komaString: 盤面の駒名
     * 
     * @return string
     */
    public static getPromote(komaString: string): string {
        if(this.komaData[this.komaAtoi(komaString)]['promoNum']) {
            return this.komaData[this.komaData[this.komaAtoi(komaString)]['promoNum']]['banName'];
        }else {
            return null;
        }
    }

    /**
     * 駒番号から駒名の文字配列を返す
     * 
     * @param komaType: 駒の文字列
     * 
     * @return string
     */
    public static komaItoa(komaType: number): string {
        return this.komaData[komaType]['banName'];
    }

    /**
     * 駒名の文字配列から駒番号を返す
     * 
     * @param komaString: 駒の文字列
     * 
     * @return Array
     */
    public static komaAtoi(komaString: string): number {
        let komaType: number = 0;

        switch(komaString) {
            case '*':
                komaType = KOMA.NONE;
                break;
            case 'FU':
                komaType = KOMA.FU;
                break;
            case 'KY':
                komaType = KOMA.KY;
                break;
            case 'KE':
                komaType = KOMA.KE;
                break;
            case 'GI':
                komaType = KOMA.GI;
                break;
            case 'KI':
                komaType = KOMA.KI;
                break;
            case 'KA':
                komaType = KOMA.KA;
                break;
            case 'HI':
                komaType = KOMA.HI;
                break;
            case 'OU':
                komaType = KOMA.OU;
                break;
            case 'TO':
                komaType = KOMA.TO;
                break;
            case 'NY':
                komaType = KOMA.NY;
                break;
            case 'NK':
                komaType = KOMA.NK;
                break;
            case 'NG':
                komaType = KOMA.NG;
                break;
            case 'UM':
                komaType = KOMA.UM;
                break;
            case 'RY':
                komaType = KOMA.RY;
                break;
            default:
                komaType = KOMA.NONE;
                break;
        }

        return komaType;
    }
}
