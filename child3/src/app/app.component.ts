// app.component.ts (Child - now host)
import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'child3';
  username: string = '';
  email: string = '';
  password: string = '';
  loggedInUser: string | null = null;
  
  private parentOrigin = 'https://your-parent-app.netlify.app';
  private parentIframe: HTMLIFrameElement | null = null;

  ngAfterViewInit() {
    this.parentIframe = document.getElementById('parentFrame') as HTMLIFrameElement;
    
    // Configure iframe security
    // this.parentIframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-forms');
    this.parentIframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation allow-storage-access-by-user-activation');
    
    // Listen for messages from parent iframe
    window.addEventListener('message', this.handleChildMessage.bind(this));
    
    // Request initial user data
    this.parentIframe.onload = () => {
      this.requestUserData();
    };
  }

  private handleChildMessage(event: MessageEvent) {
    if (event.origin !== this.parentOrigin) return;
    
    const { action, data } = event.data;
    console.log(`[Child] Received ${action} from parent`);

    if (action === 'USER_UPDATE') {
      this.loggedInUser = data?.username || null;
      console.log(`[Child] Updated user to: ${this.loggedInUser}`);
    }
  }

  private requestUserData() {
    if (!this.parentIframe?.contentWindow) return;
    
    console.log(`[Child] Requesting user data from parent`);
    try {
      this.parentIframe.contentWindow.postMessage({
        action: 'GET_USER_REQUEST'
      }, this.parentOrigin);
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  }

  login() {
    const userData = {
      username: this.username,
      email: this.email,
      password: this.password
    };
    
    console.log(`[Child] Sending login request to parent :`, userData);
    try {
      this.parentIframe?.contentWindow?.postMessage({
        action: 'LOGIN_REQUEST',
        data: userData
      }, this.parentOrigin);
    } catch (e) {
      console.error('Failed to send login request:', e);
    }
  }
}