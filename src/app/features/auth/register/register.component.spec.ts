import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslocoTestingModule } from '@ngneat/transloco';
import { RegisterComponent } from './register.component';
import { RegisterService } from './services/register.service';
import { MATERIAL_FORMS } from '../../shared/material/material-imports';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let registerService: jasmine.SpyObj<RegisterService>;

  beforeEach(async () => {
    const registerServiceSpy = jasmine.createSpyObj('RegisterService', ['register', 'getPasswordStrength']);

    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        RouterTestingModule,
        NoopAnimationsModule,
        ...MATERIAL_FORMS,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, es: {} },
          translocoConfig: {
            availableLangs: ['en', 'es'],
            defaultLang: 'en',
          }
        })
      ],
      providers: [
        { provide: RegisterService, useValue: registerServiceSpy }
      ]
    })
    .compileComponents();

    registerService = TestBed.inject(RegisterService) as jasmine.SpyObj<RegisterService>;
    registerService.getPasswordStrength.and.returnValue({ strength: 0, label: '', color: '' });
    
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with all required fields', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('userName')).toBeTruthy();
    expect(component.registerForm.get('displayName')).toBeTruthy();
    expect(component.registerForm.get('email')).toBeTruthy();
    expect(component.registerForm.get('password')).toBeTruthy();
    expect(component.registerForm.get('confirmPassword')).toBeTruthy();
  });

  it('should validate required fields', () => {
    expect(component.registerForm.valid).toBeFalsy();
    
    component.registerForm.patchValue({
      userName: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!'
    });
    
    expect(component.registerForm.valid).toBeTruthy();
  });

  it('should validate password confirmation', () => {
    component.registerForm.patchValue({
      userName: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!',
      confirmPassword: 'DifferentPass123!'
    });
    
    expect(component.registerForm.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should toggle password visibility', () => {
    expect(component.hidePassword).toBeTruthy();
    component.togglePasswordVisibility();
    expect(component.hidePassword).toBeFalsy();
  });
});
