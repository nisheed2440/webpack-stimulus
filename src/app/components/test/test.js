import {Controller} from 'stimulus';
import App from 'app';
import './test.scss';

class Test extends Controller {
  static targets = [ 'title', 'output', 'notification'];
  connect() {
    this.notificationTarget.classList.add('is-hidden');
    console.log('here!');
  }

  greet(e) {
    e.preventDefault();
    if(this.titleTarget.value.trim() !== '') {
      this.notificationTarget.classList.remove('is-hidden');
      this.outputTarget.textContent = `${this.titleTarget.value}`;
    }
  }

  cancel(e) {
    e.preventDefault();
    this.notificationTarget.classList.add('is-hidden');
    this.titleTarget.value = '';
  }
}

App.register('test', Test);

export default Test;