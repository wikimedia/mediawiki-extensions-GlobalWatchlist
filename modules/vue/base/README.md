# Shared components

The GlobalWatchlist extension uses multiple Vue components that should eventually be replaced by
standard versions shared across multiple mediawiki repositories.
See [T249840](https://phabricator.wikimedia.org/T249840) for more information.

These components are:

* [Button.vue](./Button.vue)
* [CollapsibleWrapper.vue](./CollapsibleWrapper.vue)
* [LoadingBar.vue](./LoadingBar.vue)

For now, local versions of these generic components are used, but they are merely
[stub versions](https://en.wikipedia.org/wiki/Method_stub) and do not reflect the intended
user-facing display.

Additionally, the [AsOf.vue](./../AsOf.vue) component may be migrated to a generic label component
that would also belong in this category of components that should be shared.
