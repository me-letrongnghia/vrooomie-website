import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();

  ngOnInit() {
    // Disable body scroll when modal opens
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy() {
    // Re-enable body scroll when modal closes
    document.body.style.overflow = 'auto';
  }

  onClose() {
    this.close.emit();
  }
}
