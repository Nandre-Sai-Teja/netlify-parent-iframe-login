import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'parent';
  username: string = '';
  email: string = '';
  password: string = '';
  loggedInUser: string | null = null;
  
  private allowedChildOrigins = [
    'https://your-child1-app.netlify.app',    
    'https://your-child2-app.netlify.app', 
    'https://your-child3-app.netlify.app'
  ];
  
  private currentChildOrigin: string | null = null;
  private isEmbedded = false;

  ngOnInit() {
    //checks if the current window is embedded in another window
    this.isEmbedded = window !== window.parent;
    
    if (this.isEmbedded) {
      // Store which child we're embedded in
      this.currentChildOrigin = document.referrer ? 
        new URL(document.referrer).origin : 
        null; //extracts just the origin 
      
      window.addEventListener('message', this.handleParentMessage.bind(this));
    }
    
    this.checkExistingUser();
  }

  private handleParentMessage(event: MessageEvent) {
    if (!this.allowedChildOrigins.includes(event.origin)) return;
    
    const { action } = event.data;
    console.log(`[Parent] Received ${action} from ${event.origin}`);

    if (action === 'GET_USER_REQUEST') {
      this.sendCurrentUserToChild(event.origin);
    } else if (action === 'LOGIN_REQUEST') {
      this.processLogin(event.data.data);
    }
  }

  private sendCurrentUserToChild(targetOrigin: string) {
    if (!this.isEmbedded) return;
    
    const userDataString = localStorage.getItem('currentUser');
    if (!userDataString) return;
    
    try {
      const userData = JSON.parse(userDataString);
      console.log(`[Parent] Sending user to ${targetOrigin}`);
      window.parent.postMessage({
        action: 'USER_UPDATE',
        data: userData
      }, targetOrigin);
    } catch (e) {
      console.error('Failed to send user data:', e);
    }
  }

  private processLogin(userData: any) {
    try {
      console.log(`[Parent] Processing login:`, userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      this.loggedInUser = userData.username;
      
      // Only send to the child we're embedded in
      if (this.isEmbedded && this.currentChildOrigin) {
        this.sendCurrentUserToChild(this.currentChildOrigin);
      }
    } catch (e) {
      console.error('Failed to process login:', e);
    }
  }

  private checkExistingUser() {
    const userDataString = localStorage.getItem('currentUser');
    if (!userDataString) return;
    
    try {
      const userData = JSON.parse(userDataString);
      if (userData?.username) {
        this.loggedInUser = userData.username;
        if (this.isEmbedded && this.currentChildOrigin) {
          this.sendCurrentUserToChild(this.currentChildOrigin);
        }
      }
    } catch (e) {
      console.error('Failed to check existing user:', e);
    }
  }

  login() {
    const userData = {
      username: this.username,
      email: this.email,
      password: this.password
    };
    this.processLogin(userData);
  }
}