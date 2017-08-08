import * as m from 'mithril';

import '../scss/main.scss';
import Kifu from './kifu';


//const greeter = new Greeter('Hello, my friend! Checkout your first ts app!');
//document.body.innerHTML = greeter.greet();

class KifuApp {
    constructor(){
        console.log("use kifu component");

        window.onload = ()=>{
            console.log('this is awesome app');
            m.route(document.body,'/',{'/':new Kifu()});
        }
    }
}

new KifuApp();
