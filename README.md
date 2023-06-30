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

This should run the Dashboard with the example extension defined in `pkg/example`, buily and running
against the Dashboard shell code checkout out in the first step above.


## Notes

TODO