import { Directive, Input, TemplateRef, inject } from '@angular/core';
import { Observable } from 'rxjs';

interface Context<T> {
  $implicit: T;
}

@Directive({
  selector: 'ng-template[appTableColumnCellTemplate]',
  standalone: true,
})
export class TableColumnCellTemplateDirective<T extends object> {
  @Input() appTableColumnCellTemplateTypeOf!: T | T[] | Observable<T[]>;

  templateRef = inject(TemplateRef<Context<T>>);

  static ngTemplateContextGuard<TContext extends object>(
    directive: TableColumnCellTemplateDirective<TContext>,
    context: unknown
  ): context is Context<TContext> {
    return true;
  }
}
