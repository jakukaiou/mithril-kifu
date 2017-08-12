// 将棋用語等の定数定義、および将棋ルールによる定義値を返す変数、関数群を扱うネームスペース

// 先手、後手
export const PLAYER = {
    SENTE: 0,
    GOTE : 1
};

// 駒の種類
export const KOMA = {
    FU   : 0,   // 歩
    KY   : 1,   // 香
    KE   : 2,   // 桂
    GI   : 3,   // 銀
    KI   : 4,   // 金
    KA   : 5,   // 角
    HI   : 6,   // 飛
    OU   : 7,   // 王

    TO   : 8,    // と
    NY   : 9,    // 成香
    NK   : 10,   // 成桂
    NG   : 11,   // 成銀
    UM   : 12,   // 馬
    RY   : 13    // 龍
};

export class Info {
    private static komaData: Array<Object> = [
        {
            // 歩
            name       : '歩',      // 略駒名
            fullName   : '歩兵',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 香
            name       : '香',      // 略駒名
            fullName   : '香車',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 桂馬
            name       : '桂',      // 略駒名
            fullName   : '桂馬',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 銀
            name       : '銀',      // 略駒名
            fullName   : '銀将',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 金
            name       : '金',      // 略駒名
            fullName   : '金将',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 飛車
            name       : '飛',      // 略駒名
            fullName   : '飛車',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 王
            name       : '王',      // 略駒名
            fullName   : '王将',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 成香
            name       : '成香',     // 略駒名
            fullName   : '成香',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 成桂
            name       : '成桂',      // 略駒名
            fullName   : '成桂',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 成銀
            name       : '成銀',      // 略駒名
            fullName   : '成銀',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 馬
            name       : '馬',      // 略駒名
            fullName   : '竜馬',     // 駒名
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
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
        {
            // 龍
            name       : '龍',      // 略駒名
            fullName   : '龍王',     // 駒名
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
            ],
            canPromote : false,     // 成れるかどうか
            isPromote  : true,      // 成り駒かどうか
            promoNum   : null,      // 成り先
            isSpecial  : false,     // 特別駒かどうか
            extra      : null       // 追加情報
        },
    ];

    
    /**
     * 駒の略称を返す
     * 
     * @param komaNum: 駒の番号
     * 
     * @return String
     */
    public static getKanji(komaNum: number) {
        return this.komaData[komaNum]['name'];
    }
}
