import Helper from '../../helper';
import { DashletEditorPanel } from '../dashleteditorpanel';


//ugly hack
declare global {
    interface Window {
        $: any;
    }
}
export class BsDashletEditorPanel extends DashletEditorPanel {
    closeEditor(canceled: boolean) {
        //this.remove();
        this.editor.dashlet.editor = undefined;
    }

    initializeElement() {
        super.initializeElement();
    }

    showEditor() {

        var modal = window.$(Helper.getFirstElementChild(this)).modal('show');
        modal.on('hidden.bs.modal', function () { this.remove(); }.bind(this));
        modal.on('hidden', function () { this.remove(); }.bind(this));
    }

  
}

