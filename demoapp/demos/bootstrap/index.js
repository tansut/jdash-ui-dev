(function (global) {

    global.app.constructor.prototype.createDashletModuleEls = function () {
        for (var i = 0; i < this.dashletModules.length; i++) {
            var module = this.dashletModules[i];
            var el = document.importNode(this.dashletListItemTemplate.content, true);
            var content = el.firstElementChild;
            content.setAttribute('j-type', 'j-dashlet-module')
            content.setAttribute('j-module-id', module.elementTag);
            content.classList.add('dashlet-module');
            var titleEl = content.querySelector('[dashlet-title-element]');
            if (titleEl) {
                titleEl.textContent = module.title || module.elementTag;
            }
            var addBtn = content.querySelector('[dashlet-add-btn]');
            if (addBtn) {
                addBtn.setAttribute('j-module-id', module.elementTag);
                addBtn.addEventListener('click', function (event) {
                    var moduleId = event.target.getAttribute('j-module-id');
                    this.dashboard.addDashlet(moduleId);
                }.bind(this))
            }

            this.dashletList.appendChild(el);
        }
    }

    global.app.constructor.prototype.createDashboardList = function (dashboards) {
        this.dashboardListContainer.innerHTML = '';
        dashboards.forEach(function (dashboard) {
            var el = document.importNode(this.dashboardListItemTemplate.content, true);
            var a = el.firstElementChild;
            a.addEventListener('click', this.loadDashboard.bind(this, dashboard, null));

            a.firstElementChild.textContent = dashboard.title;
            a.setAttribute('dashboard-id', dashboard.id);
            this.dashboardListContainer.appendChild(a);
        }.bind(this))
    }

    global.app.constructor.prototype.loadThemes = function () {
        var bsThemes = ["JDash","Red", "Green", "Blue", "Yellow"];
        jdash.ThemeManager.getThemes().forEach(function (theme) {
            if (bsThemes.indexOf(theme.name) > -1) {
                var tpl = $('<li><a href="javascript:;" class="thm">Action</a></li>');
                tpl.find('.thm').text(theme.name);
                this.themesEl.appendChild(tpl[0]);
                tpl[0].addEventListener('click', this.changeTheme.bind(this, theme));                
            };
        }.bind(this))
    }


})(window);