import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectComponent } from './select';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SelectComponent],
  template: `<app-select [options]="options" [formControl]="control" />`,
})
class HostComponent {
  options = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ];
  control = new FormControl('b');
}

describe('SelectComponent', () => {
  it('hiện đúng giá trị ban đầu của form (không phải option đầu)', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select.value).toBe('b');

    fixture.componentInstance.control.setValue('a');
    fixture.detectChanges();
    expect(select.value).toBe('a');
  });
});
