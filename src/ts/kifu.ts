import * as m from 'mithril';
import * as _ from 'lodash';

import * as SHOGI from './shogi';
import ComponentBasic from './componentbasic';
import KifuData from './kifudata';

/**
 * 棋譜全体の表示クラス 
 */
export default class Kifu extends ComponentBasic {

    // 棋譜のデータ
    private kifuData;

    /**
     * コンストラクタ 
     * 
     * @param jkfData: JSONフォーマットの棋譜形式
     * 
     * @return void
     */
    constructor(jkfData: Object) {
        super();

        this.kifuData = new KifuData(jkfData, false);

        this.view = (vnode) => {
            return [
                m('div', 'Welcome Kifu World'),
                m('div', {class: 'koma_piece koma_prop_fu'})
            ];
        };
    }
}

/**
 * エラー処理用クラス
 */
class KifuError implements Error {
    public name = 'KifuError';

    constructor(public message: string) {

    }

    toString() {
        return this.name + ': ' + this.message;
    }
}
