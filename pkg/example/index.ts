import { importTypes } from '@rancher/auto-import';
import { IPlugin, TabLocation } from '@shell/core/types';
import { ExampleProvisioner } from './provisioner';

// Init the package
export default function(plugin: IPlugin) {
  // Auto-import model, detail, edit from the folders
  importTypes(plugin);

  // Provide plugin metadata from package.json
  plugin.metadata = require('./package.json');

  // Register custom provisioner object
  plugin.register('provisioner', ExampleProvisioner.ID, ExampleProvisioner);

  // Register that no cloud-credential needed
  plugin.register('cloud-credential', ExampleProvisioner.ID, false);

  // Register custom machine config component
  plugin.register('machine-config', ExampleProvisioner.ID, () => import('./src/example-machine-config.vue'));

  // Register an example tab component shown in the cluster detail page
  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource:     ['provisioning.cattle.io.cluster'],
    customParams:   { provider: ExampleProvisioner.ID }
  }, {
    name:      'custom',
    label:     'Custom Tab',
    component: () => import('./src/example-tab.vue')
  });
}

// TODO: RC Create a `-dev` build and supply instructions on how to use it
// TODO: RC Document new extension points as part of dashboard changes. See comment in shell docusaurus/docs/extensions/home.md
// TODO: RC review documentation in this repo. Link to docs. type def for IClusterProvisioner
// TODO: RC TEST - provisioning as non-admin (access to mgmt namespaces)
// TODO: RC done TEST - edit / remove
// TODO: RC TEST - refresh on create / edit page

// Deliverables
// - dev build (and docs to apply)
// - document on how to setup, build, install extension
// - document on extension hooks
// - document on general provisioning hooks

// Document
// - hooks. prov label
// - how to for cluster prov (general)
//   - conceptually create custom prov cluster with provider override for ui and hooks
//   - prov cluster model
//   - IClusterProvisioner
// - README in each ext

// Questions
// - collaboration for specific implementation (end to end)
// - no custom hook on delete
// - status of the prov cluster (shown in UI, metadata.state) (creating, updating, deleting, etc)

// Testing
// - Create, edit, remove a cluster
// - Add, remove machine pools from a running cluster
// - Provisioning / Managing cluster for non-admins
