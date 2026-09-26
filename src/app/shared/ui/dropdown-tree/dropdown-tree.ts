import {
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { TranslateService } from '../../../core/i18n/translate.service';
import { IconComponent } from '../icon/icon';

export interface TreeNode {
  value: string;
  label: string;
  children?: TreeNode[];
}

interface FlatNode {
  value: string;
  label: string;
  level: number;
  node: TreeNode;
}

@Component({
  selector: 'app-dropdown-tree',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './dropdown-tree.html',
})
export class DropdownTreeComponent {
  private host = inject(ElementRef<HTMLElement>);
  private translate = inject(TranslateService);

  nodes = input<TreeNode[]>([]);
  /** Để trống sẽ dùng bản dịch mặc định (common.select) theo ngôn ngữ hiện tại. */
  placeholder = input<string | null>(null);
  value = input<string | null>(null);

  valueChange = output<string>();

  open = signal(false);
  query = signal('');
  expanded = signal<Set<string>>(new Set());

  defaultPlaceholder = computed(() => {
    this.translate.locale();
    return this.translate.t('common.select');
  });

  searchPlaceholder = computed(() => {
    this.translate.locale();
    return this.translate.t('common.search');
  });

  noResultText = computed(() => {
    this.translate.locale();
    return this.translate.t('common.noResult');
  });

  private allFlat = computed(() => this.flatten(this.nodes(), 0));

  selectedLabel = computed(() => this.allFlat().find((n) => n.value === this.value())?.label ?? '');

  visibleNodes = computed<FlatNode[]>(() => {
    const q = this.query().trim().toLowerCase();

    if (q) {
      return this.allFlat().filter((n) => n.label.toLowerCase().includes(q));
    }

    const expanded = this.expanded();
    const result: FlatNode[] = [];
    const walk = (nodes: TreeNode[], level: number) => {
      for (const node of nodes) {
        result.push({ value: node.value, label: node.label, level, node });
        if (node.children?.length && expanded.has(node.value)) {
          walk(node.children, level + 1);
        }
      }
    };
    walk(this.nodes(), 0);
    return result;
  });

  private flatten(nodes: TreeNode[], level: number): FlatNode[] {
    const result: FlatNode[] = [];
    for (const node of nodes) {
      result.push({ value: node.value, label: node.label, level, node });
      if (node.children?.length) {
        result.push(...this.flatten(node.children, level + 1));
      }
    }
    return result;
  }

  toggle(): void {
    this.open.update((v) => !v);
  }

  toggleExpand(event: Event, value: string): void {
    event.stopPropagation();
    this.expanded.update((set) => {
      const next = new Set(set);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  select(flat: FlatNode): void {
    if (flat.node.children?.length) {
      this.toggleExpand({ stopPropagation() {} } as Event, flat.value);
      return;
    }
    this.valueChange.emit(flat.value);
    this.open.set(false);
    this.query.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
