# Rancher Cluster Provisioning Example

This repository illustrates custom cluster provisioning via Rancher Extensions without requiring
Node Drivers.

This is work in progress.

## To use

In a separate folder, clone this fork and branch of the Rancher Dashboard with:

```
git clone -b cluster-prov-extensions https://github.com/nwmac/dashboard.git
```

Then:

```
cd dashboard/shell
yarn link
```

This will link the Dashboard code you checked out above for the `@rancher/shell` packages.

Back in the folder for the checkout of this repository, link to the shell above with:

```
yarn install
yarn link @rancher/shell
```

Set the `API` environment variable to point to your Rancher backend and run with:

```
yarn dev
```

This should run the Dashboard with the example extension defined in `pkg/example`, built and running
against the Dashboard shell code checkout out in the first step above.


## Notes

The Dashboard changes in the `cluster-prov-extensions` branch are required for this extension to work.

This extension adds a new provisioner 'Example` - this illustrates a customer provisioner that leverages the RKE2 flow
- this leveraged the same Cloud Credential and Machine Config components as with Node Drivers - but does not
require a node driver AND allows the custom provisioner to control the actual provisioning step in a couple of ways.

Note that the changes to allow extensions to add cards to the provisioning screen will support using a `link` - allowing
an extension to add a provider choice to the UI that when clicked, takes the user to a new route where the extension
would need to take care of providing all UI and provisioning.

This example adds a custom provider that supports a new API with this line in the `index.ts` file:

```
  plugin.register('provisioner', 'test', ExampleProvisioner);
```

Note that `register` allows us to register an arbitrary extension and we introduce the type `provisioner`.

The following lines:

```
  plugin.register('cloud-credential', 'test', false);
  plugin.register('machine-config', 'test', () => import('./src/test.vue'));
```

register that no cloud credential is needed and register a custom component to be used for Machine Configuration within a node/machine pool - this
is the same as with Node Drivers - e.g. with the OpenStack node driver example. 

Lastly, we register a new tab to be shown when looking at the detail of a cluster provisioned with our custom provider:

```
  plugin.addTab(TabLocation.RESOURCE_DETAIL, {
    resource: ['provisioning.cattle.io.cluster'],
    params: { provider: 'test' }
  }, {
    name: 'custom',
    label: 'Custom Tab',
    component: () => import('./src/test.vue')
  });
```

Note we use the new `params` to allow us to target the tab only when the cluster is of our provider type.

The other main code is in `provisionner.ts`.

This is fairly self-explanatory - I left in `detailTabs` although this is not used - the intent was to allow the provider
to hide tabs in the detail view - I left the code out for this from the dashboard changes as I think we need a more generic
way to allow extensions to hide tabs for resources - this was specific to clusters.

This example uses the `provision` method to do the provisioning - it just saves the cluster object but adds our annotation first. This is
equivalent to what we do with an imported cluster.

By adding the annotation, the cluster will be shown as type `Example` in the UI - this is determined by the localisation file `en-us` - we set
`cluster.provider.test` to `Example`.