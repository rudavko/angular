/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CommonModule} from '@angular/common';
import {ChangeDetectorRef, Component, ComponentFactoryResolver, Directive, EmbeddedViewRef, Injector, NgModule, TemplateRef, ViewChild, ViewContainerRef, ViewRef} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {onlyInIvy} from '@angular/private/testing';

describe('view insertion', () => {
  describe('of a simple template', () => {
    it('should insert into an empty container, at the front, in the middle, and at the end', () => {
      let _counter = 0;

      @Component({
        selector: 'increment-comp',
        template: `<span>created{{counter}}</span>`,
      })
      class IncrementComp {
        counter = _counter++;
      }

      @Component({
        template: `
              <ng-template #simple><increment-comp></increment-comp></ng-template>
              <div #container></div>
            `
      })
      class App {
        @ViewChild('container', {read: ViewContainerRef, static: true})
        container: ViewContainerRef = null !;

        @ViewChild('simple', {read: TemplateRef, static: true})
        simple: TemplateRef<any> = null !;

        view0: EmbeddedViewRef<any> = null !;
        view1: EmbeddedViewRef<any> = null !;
        view2: EmbeddedViewRef<any> = null !;
        view3: EmbeddedViewRef<any> = null !;

        constructor(public changeDetector: ChangeDetectorRef) {}

        ngAfterViewInit() {
          // insert at the front
          this.view1 = this.container.createEmbeddedView(this.simple);  // "created0"

          // insert at the front again
          this.view0 = this.container.createEmbeddedView(this.simple, {}, 0);  // "created1"

          // insert at the end
          this.view3 = this.container.createEmbeddedView(this.simple);  // "created2"

          // insert in the middle
          this.view2 = this.container.createEmbeddedView(this.simple, {}, 2);  // "created3"

          // We need to run change detection here to avoid
          // ExpressionChangedAfterItHasBeenCheckedError because of the value updating in
          // increment-comp
          this.changeDetector.detectChanges();
        }
      }

      TestBed.configureTestingModule({
        declarations: [App, IncrementComp],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.container.indexOf(app.view0)).toBe(0);
      expect(app.container.indexOf(app.view1)).toBe(1);
      expect(app.container.indexOf(app.view2)).toBe(2);
      expect(app.container.indexOf(app.view3)).toBe(3);
      // The text in each component differs based on *when* it was created.
      expect(fixture.nativeElement.textContent).toBe('created1created0created3created2');
    });
  });

  describe('of an empty template', () => {
    it('should insert into an empty container, at the front, in the middle, and at the end', () => {
      @Component({
        template: `
              <ng-template #empty></ng-template>
              <div #container></div>
            `
      })
      class App {
        @ViewChild('container', {read: ViewContainerRef})
        container: ViewContainerRef = null !;

        @ViewChild('empty', {read: TemplateRef})
        empty: TemplateRef<any> = null !;

        view0: EmbeddedViewRef<any> = null !;
        view1: EmbeddedViewRef<any> = null !;
        view2: EmbeddedViewRef<any> = null !;
        view3: EmbeddedViewRef<any> = null !;

        ngAfterViewInit() {
          // insert at the front
          this.view1 = this.container.createEmbeddedView(this.empty);

          // insert at the front again
          this.view0 = this.container.createEmbeddedView(this.empty, {}, 0);

          // insert at the end
          this.view3 = this.container.createEmbeddedView(this.empty);

          // insert in the middle
          this.view2 = this.container.createEmbeddedView(this.empty, {}, 2);
        }
      }

      TestBed.configureTestingModule({
        declarations: [App],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.container.indexOf(app.view0)).toBe(0);
      expect(app.container.indexOf(app.view1)).toBe(1);
      expect(app.container.indexOf(app.view2)).toBe(2);
      expect(app.container.indexOf(app.view3)).toBe(3);
    });
  });

  describe('of an ng-content projection', () => {
    it('should insert into an empty container, at the front, in the middle, and at the end', () => {
      @Component({
        selector: 'comp',
        template: `
                  <ng-template #projection><ng-content></ng-content></ng-template>
                  <div #container></div>
                `
      })
      class Comp {
        @ViewChild('container', {read: ViewContainerRef})
        container: ViewContainerRef = null !;

        @ViewChild('projection', {read: TemplateRef})
        projection: TemplateRef<any> = null !;

        view0: EmbeddedViewRef<any> = null !;
        view1: EmbeddedViewRef<any> = null !;
        view2: EmbeddedViewRef<any> = null !;
        view3: EmbeddedViewRef<any> = null !;

        ngAfterViewInit() {
          // insert at the front
          this.view1 = this.container.createEmbeddedView(this.projection);

          // insert at the front again
          this.view0 = this.container.createEmbeddedView(this.projection, {}, 0);

          // insert at the end
          this.view3 = this.container.createEmbeddedView(this.projection);

          // insert in the middle
          this.view2 = this.container.createEmbeddedView(this.projection, {}, 2);
        }
      }

      @Component({
        template: `
          <comp>test</comp>
        `
      })
      class App {
      }

      TestBed.configureTestingModule({
        declarations: [App, Comp],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const comp = fixture.debugElement.query(By.directive(Comp)).injector.get(Comp);

      expect(comp.container.indexOf(comp.view0)).toBe(0);
      expect(comp.container.indexOf(comp.view1)).toBe(1);
      expect(comp.container.indexOf(comp.view2)).toBe(2);
      expect(comp.container.indexOf(comp.view3)).toBe(3);

      // Both ViewEngine and Ivy only honor one of the inserted ng-content components, even though
      // all are inserted.
      expect(fixture.nativeElement.textContent).toBe('test');
    });
  });

  describe('of another container like ngIf', () => {
    it('should insert into an empty container, at the front, in the middle, and at the end', () => {
      @Component({
        template: `
                  <ng-template #subContainer><div class="dynamic" *ngIf="true">test</div></ng-template>
                  <div #container></div>
                `
      })
      class App {
        @ViewChild('container', {read: ViewContainerRef})
        container: ViewContainerRef = null !;

        @ViewChild('subContainer', {read: TemplateRef})
        subContainer: TemplateRef<any> = null !;

        view0: EmbeddedViewRef<any> = null !;
        view1: EmbeddedViewRef<any> = null !;
        view2: EmbeddedViewRef<any> = null !;
        view3: EmbeddedViewRef<any> = null !;

        constructor(public changeDetectorRef: ChangeDetectorRef) {}

        ngAfterViewInit() {
          // insert at the front
          this.view1 = this.container.createEmbeddedView(this.subContainer, null, 0);

          // insert at the front again
          this.view0 = this.container.createEmbeddedView(this.subContainer, null, 0);

          // insert at the end
          this.view3 = this.container.createEmbeddedView(this.subContainer, null, 2);

          // insert in the middle
          this.view2 = this.container.createEmbeddedView(this.subContainer, null, 2);

          // We need to run change detection here to avoid
          // ExpressionChangedAfterItHasBeenCheckedError because of the value getting passed to ngIf
          // in the template.
          this.changeDetectorRef.detectChanges();
        }
      }

      TestBed.configureTestingModule({
        declarations: [App],
        imports: [CommonModule],
      });
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const app = fixture.componentInstance;

      expect(app.container.indexOf(app.view0)).toBe(0);
      expect(app.container.indexOf(app.view1)).toBe(1);
      expect(app.container.indexOf(app.view2)).toBe(2);
      expect(app.container.indexOf(app.view3)).toBe(3);

      expect(fixture.debugElement.queryAll(By.css('div.dynamic')).length).toBe(4);
    });
  });

  describe('before another view', () => {
    @Directive({selector: '[viewInserting]', exportAs: 'vi'})
    class ViewInsertingDir {
      constructor(private _vcRef: ViewContainerRef) {}

      insert(beforeView: ViewRef, insertTpl: TemplateRef<{}>) {
        this._vcRef.insert(beforeView, 0);
        this._vcRef.createEmbeddedView(insertTpl, {}, 0);
      }
    }

    describe('before embedded view', () => {
      @Component({
        selector: 'test-cmpt',
        template: `
          <ng-template #insert>insert</ng-template>  
          <ng-template #before>|before</ng-template>
          
          <div><ng-template #vi="vi" viewInserting></ng-template></div>
        `
      })
      class TestCmpt {
        @ViewChild('before', {static: true}) beforeTpl !: TemplateRef<{}>;
        @ViewChild('insert', {static: true}) insertTpl !: TemplateRef<{}>;
        @ViewChild('vi', {static: true}) viewInsertingDir !: ViewInsertingDir;

        minutes = 10;

        insert() {
          const beforeView = this.beforeTpl.createEmbeddedView({});
          // change-detect the "before view" to create all child views
          beforeView.detectChanges();
          this.viewInsertingDir.insert(beforeView, this.insertTpl);
        }
      }

      beforeEach(() => {
        TestBed.configureTestingModule({
          declarations: [TestCmpt, ViewInsertingDir],
          imports: [CommonModule],
        });
      });

      function createAndInsertViews(beforeTpl: string): any {
        TestBed.overrideTemplate(TestCmpt, `
          <ng-template #insert>insert</ng-template>  
          <ng-template #before>${beforeTpl}</ng-template>
          
          <div><ng-template #vi="vi" viewInserting></ng-template></div>
        `);
        const fixture = TestBed.createComponent(TestCmpt);
        fixture.detectChanges();

        fixture.componentInstance.insert();
        fixture.detectChanges();

        return fixture.nativeElement;
      }


      it('should insert before a view with the text node as the first root node',
         () => { expect(createAndInsertViews('|before').textContent).toBe('insert|before'); });

      it('should insert before a view with the element as the first root node', () => {
        expect(createAndInsertViews('<span>|before</span>').textContent).toBe('insert|before');
      });

      it('should insert before a view with the ng-container as the first root node', () => {
        expect(createAndInsertViews(`
          <ng-container>
            <ng-container>|before</ng-container>
          </ng-container>
        `).textContent)
            .toBe('insert|before');
      });

      it('should insert before a view with ICU container inside a ng-container as the first root node',
         () => {
           expect(
               createAndInsertViews(
                   `<ng-container i18n>{minutes, plural, =0 {just now} =1 {one minute ago} other {|before}}</ng-container>`)
                   .textContent)
               .toBe('insert|before');
         });

      it('should insert before a view with a container as the first root node', () => {
        expect(createAndInsertViews(`<ng-template [ngIf]="true">|before</ng-template>`).textContent)
            .toBe('insert|before');

      });

      it('should insert before a view with an empty container as the first root node', () => {
        expect(createAndInsertViews(`<ng-template [ngIf]="true"></ng-template>`).textContent)
            .toBe('insert');

      });

      onlyInIvy('VE incorrectly inserts views before ng-container content')
          .it('should insert before a view with a ng-container where ViewContainerRef is injected',
              () => {
                expect(createAndInsertViews(`
          <ng-container [ngTemplateOutlet]="after">|before</ng-container>
          <ng-template #after>|after</ng-template>
        `).textContent)
                    .toBe('insert|before|after');

              });

      it('should insert before a view with an element where ViewContainerRef is injected', () => {
        expect(createAndInsertViews(`
          <div [ngTemplateOutlet]="after">|before</div>
          <ng-template #after>|after</ng-template>
        `).textContent)
            .toBe('insert|before|after');

      });

      it('should insert before a view with an empty projection as the first root node', () => {
        expect(createAndInsertViews(`<ng-content></ng-content>|before`).textContent)
            .toBe('insert|before');
      });

      it('should insert before a view with complex node structure', () => {
        expect(createAndInsertViews(`
          <ng-template [ngIf]="true">
            <ng-container>
              <ng-container>
                <ng-template [ngIf]="true">|before</ng-template>
              </ng-container>
            </ng-container>
          </ng-template>
        `).textContent)
            .toBe('insert|before');
      });

    });

    describe('before embedded view with projection', () => {

      @Component({
        selector: 'with-content',
        template: `
          <ng-template #insert>insert</ng-template>
          <ng-template #before><ng-content></ng-content></ng-template>
          <div><ng-template #vi="vi" viewInserting></ng-template></div>
        `
      })
      class WithContentCmpt {
        @ViewChild('insert', {static: true}) insertTpl !: TemplateRef<{}>;
        @ViewChild('before', {static: true}) beforeTpl !: TemplateRef<{}>;
        @ViewChild('vi', {static: true}) viewInsertingDir !: ViewInsertingDir;

        insert() {
          const beforeView = this.beforeTpl.createEmbeddedView({});
          // change-detect the "before view" to create all child views
          beforeView.detectChanges();
          this.viewInsertingDir.insert(beforeView, this.insertTpl);
        }
      }

      @Component({selector: 'test-cmpt', template: ''})
      class TestCmpt {
        @ViewChild('wc', {static: true}) withContentCmpt !: WithContentCmpt;
      }

      beforeEach(() => {
        TestBed.configureTestingModule({
          declarations: [ViewInsertingDir, WithContentCmpt, TestCmpt],
          imports: [CommonModule],
        });
      });

      it('should insert before a view with projected text nodes', () => {
        TestBed.overrideTemplate(TestCmpt, `<with-content #wc>|before</with-content>`);
        const fixture = TestBed.createComponent(TestCmpt);
        fixture.detectChanges();

        fixture.componentInstance.withContentCmpt.insert();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toBe('insert|before');
      });

      it('should insert before a view with projected container', () => {
        TestBed.overrideTemplate(
            TestCmpt,
            `<with-content #wc><ng-template [ngIf]="true">|before</ng-template></with-content>`);

        const fixture = TestBed.createComponent(TestCmpt);
        fixture.detectChanges();

        fixture.componentInstance.withContentCmpt.insert();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toBe('insert|before');
      });

    });

    describe('before component view', () => {
      @Directive({selector: '[viewInserting]', exportAs: 'vi'})
      class ViewInsertingDir {
        constructor(private _vcRef: ViewContainerRef) {}

        insert(beforeView: ViewRef, insertTpl: TemplateRef<{}>) {
          this._vcRef.insert(beforeView, 0);
          this._vcRef.createEmbeddedView(insertTpl, {}, 0);
        }
      }

      @Component({selector: 'dynamic-cmpt', template: '|before'})
      class DynamicComponent {
      }

      it('should insert in front a dynamic component view', () => {
        @Component({
          selector: 'test-cmpt',
          template: `
                <ng-template #insert>insert</ng-template>  
                <div><ng-template #vi="vi" viewInserting></ng-template></div>
              `
        })
        class TestCmpt {
          @ViewChild('insert', {static: true}) insertTpl !: TemplateRef<{}>;
          @ViewChild('vi', {static: true}) viewInsertingDir !: ViewInsertingDir;

          constructor(private _cfr: ComponentFactoryResolver, private _injector: Injector) {}

          insert() {
            // create a dynamic component view to act as an "insert before" view
            const componentFactory = this._cfr.resolveComponentFactory(DynamicComponent);
            const beforeView = componentFactory.create(this._injector).hostView;
            // change-detect the "before view" to create all child views
            beforeView.detectChanges();
            this.viewInsertingDir.insert(beforeView, this.insertTpl);
          }
        }


        @NgModule({
          declarations: [TestCmpt, ViewInsertingDir, DynamicComponent],
          imports: [CommonModule],
          entryComponents: [DynamicComponent]
        })
        class TestModule {
        }

        TestBed.configureTestingModule({imports: [TestModule]});

        const fixture = TestBed.createComponent(TestCmpt);
        fixture.detectChanges();

        fixture.componentInstance.insert();
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).toBe('insert|before');
      });

    });
  });

});
