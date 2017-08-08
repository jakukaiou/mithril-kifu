import * as m from 'mithril';
import * as _ from 'lodash';

import ComponentBasic from './componentbasic';

export default class Kifu extends ComponentBasic {
    constructor(){
        super();
        console.log('oh greatest kifu');

        this.view = (vnode)=>{
            return [
                m('div','Welcome Kifu World')
            ]
        }
    }
}