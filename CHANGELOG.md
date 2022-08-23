# [2.1.0](https://github.com/fabscale/ember-cognito-identity/compare/2.0.0...2.1.0) (2021-06-08)


* Update ember-auto-import to 2.x
* Update all dependencies to latest

# [2.0.0](https://github.com/fabscale/ember-cognito-identity/compare/1.5.4...2.0.0) (2021-03-03)


* feat(refactor)!: Drop `onAuthenticated()` and `onUnauthenticated()` hooks ([b50bc6d](https://github.com/fabscale/ember-cognito-identity/commit/b50bc6d3bf769331e7f96034114fd48a3e1da51d))
* feat(deps)!: Bump ember-concurrency from 1.x to 2.x ([bcf445f](https://github.com/fabscale/ember-cognito-identity/commit/bcf445f1d4fed607930e44457affa7c7e3a06ffc))


### BREAKING CHANGES

* Hooks dropped in favor of manually handling this.
* Major dependency update might be incompatible with other dependencies.










## v3.8.3 (2022-08-23)

#### :house: Internal
* [#771](https://github.com/fabscale/ember-cognito-identity/pull/771) chore(deps-dev): update release-it to 15.x ([@mydea](https://github.com/mydea))
* [#762](https://github.com/fabscale/ember-cognito-identity/pull/762) chore(deps-dev): bump ember-cli from 4.4.0 to 4.6.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#768](https://github.com/fabscale/ember-cognito-identity/pull/768) chore(deps-dev): bump eslint from 8.18.0 to 8.21.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#770](https://github.com/fabscale/ember-cognito-identity/pull/770) chore(deps-dev): bump @typescript-eslint/parser from 5.30.3 to 5.32.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#769](https://github.com/fabscale/ember-cognito-identity/pull/769) chore(deps-dev): bump @types/ember__test-helpers from 2.6.1 to 2.8.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#766](https://github.com/fabscale/ember-cognito-identity/pull/766) chore(deps-dev): bump ember-truth-helpers from 3.0.0 to 3.1.1 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#765](https://github.com/fabscale/ember-cognito-identity/pull/765) chore(deps-dev): bump ember-source from 4.5.0 to 4.6.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#764](https://github.com/fabscale/ember-cognito-identity/pull/764) chore(deps-dev): bump webpack from 5.73.0 to 5.74.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#763](https://github.com/fabscale/ember-cognito-identity/pull/763) chore(deps): bump ember-cli-htmlbars from 6.0.1 to 6.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#761](https://github.com/fabscale/ember-cognito-identity/pull/761) chore(deps): bump terser from 4.8.0 to 4.8.1 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#757](https://github.com/fabscale/ember-cognito-identity/pull/757) chore(deps-dev): bump fabscale-eslint-config from 1.4.0 to 1.5.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#758](https://github.com/fabscale/ember-cognito-identity/pull/758) chore(deps): bump @embroider/macros from 1.7.1 to 1.8.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#760](https://github.com/fabscale/ember-cognito-identity/pull/760) chore(deps-dev): bump @typescript-eslint/parser from 5.27.0 to 5.30.3 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#759](https://github.com/fabscale/ember-cognito-identity/pull/759) chore(deps-dev): bump eslint from 8.16.0 to 8.18.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#756](https://github.com/fabscale/ember-cognito-identity/pull/756) chore(deps-dev): bump @embroider/test-setup from 1.7.1 to 1.8.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#755](https://github.com/fabscale/ember-cognito-identity/pull/755) chore(deps-dev): bump ember-source from 4.4.1 to 4.5.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#754](https://github.com/fabscale/ember-cognito-identity/pull/754) chore(deps-dev): bump webpack from 5.72.0 to 5.73.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#753](https://github.com/fabscale/ember-cognito-identity/pull/753) chore(deps-dev): bump prettier from 2.6.2 to 2.7.1 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#752](https://github.com/fabscale/ember-cognito-identity/pull/752) chore(deps): bump jsdom from 16.4.0 to 16.7.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#748](https://github.com/fabscale/ember-cognito-identity/pull/748) chore(deps): bump @embroider/macros from 1.6.0 to 1.7.1 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.8.2 (2022-05-04)

#### :rocket: Enhancement
* [#725](https://github.com/fabscale/ember-cognito-identity/pull/725) feat: Expose `getAccessToken` and `getIdToken` on `cognitoData` ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#738](https://github.com/fabscale/ember-cognito-identity/pull/738) Update dev dependencies ([@mydea](https://github.com/mydea))
* [#733](https://github.com/fabscale/ember-cognito-identity/pull/733) chore(deps): bump ember-cli-typescript from 5.0.0 to 5.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#736](https://github.com/fabscale/ember-cognito-identity/pull/736) chore(deps): bump @embroider/macros from 1.5.0 to 1.6.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#726](https://github.com/fabscale/ember-cognito-identity/pull/726) Update dev dependencies ([@mydea](https://github.com/mydea))
* [#712](https://github.com/fabscale/ember-cognito-identity/pull/712) chore(deps): bump @embroider/macros from 1.2.0 to 1.5.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#715](https://github.com/fabscale/ember-cognito-identity/pull/715) chore(deps): bump @glimmer/component from 1.0.4 to 1.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#720](https://github.com/fabscale/ember-cognito-identity/pull/720) chore(deps): bump @glimmer/tracking from 1.0.4 to 1.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.8.1 (2022-03-11)

#### :bug: Bug Fix
* [#707](https://github.com/fabscale/ember-cognito-identity/pull/707) fix: Remove unneeded CSS from addon ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#693](https://github.com/fabscale/ember-cognito-identity/pull/693) chore(deps): bump @embroider/macros from 1.0.0 to 1.2.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#706](https://github.com/fabscale/ember-cognito-identity/pull/706) Update dev dependencies ([@mydea](https://github.com/mydea))
* [#696](https://github.com/fabscale/ember-cognito-identity/pull/696) chore(deps): bump ember-cli-typescript from 4.2.1 to 5.0.0 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.8.0 (2022-02-03)

#### :house: Internal
* [#689](https://github.com/fabscale/ember-cognito-identity/pull/689) Update dev depenendencies ([@mydea](https://github.com/mydea))
* [#690](https://github.com/fabscale/ember-cognito-identity/pull/690) Update ember types to v4 ([@mydea](https://github.com/mydea))
* [#679](https://github.com/fabscale/ember-cognito-identity/pull/679) chore(deps): bump ember-auto-import from 2.2.4 to 2.4.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#686](https://github.com/fabscale/ember-cognito-identity/pull/686) chore(deps): bump @embroider/macros from 0.50.2 to 1.0.0 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.7.0 (2022-01-17)

#### :rocket: Enhancement
* [#676](https://github.com/fabscale/ember-cognito-identity/pull/676) chore(deps): bump amazon-cognito-identity-js from 5.0.3 to 5.2.4 ([@mydea](https://github.com/mydea))

#### :bug: Bug Fix
* [#675](https://github.com/fabscale/ember-cognito-identity/pull/675) Ensure @babel/eslint-parser is a devDependency ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#677](https://github.com/fabscale/ember-cognito-identity/pull/677) Update dev dependencies ([@mydea](https://github.com/mydea))
* [#674](https://github.com/fabscale/ember-cognito-identity/pull/674) chore(deps): bump @embroider/macros from 0.49.0 to 0.50.2 ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.6.0 (2022-01-04)

#### :rocket: Enhancement
* [#672](https://github.com/fabscale/ember-cognito-identity/pull/672) feat: Ensure licence is correctly MIT ([@mydea](https://github.com/mydea))
* [#668](https://github.com/fabscale/ember-cognito-identity/pull/668) chore: Use `Object.assign` instead of `assign` ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#669](https://github.com/fabscale/ember-cognito-identity/pull/669) chore(deps-dev): bump ember-cli from 3.28.4 to 4.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#670](https://github.com/fabscale/ember-cognito-identity/pull/670) Update dev dependencies ([@mydea](https://github.com/mydea))
* [#665](https://github.com/fabscale/ember-cognito-identity/pull/665) chore(deps): bump @embroider/macros from 0.47.2 to 0.49.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#649](https://github.com/fabscale/ember-cognito-identity/pull/649) chore(deps-dev): Update dev dependencies ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.5.0 (2021-11-02)

#### :house: Internal
* [#636](https://github.com/fabscale/ember-cognito-identity/pull/636) chore(deps): bump ember-cli-htmlbars from 5.7.1 to 6.0.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#634](https://github.com/fabscale/ember-cognito-identity/pull/634) chore(deps): bump @embroider/macros from 0.45.0 to 0.47.1 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#644](https://github.com/fabscale/ember-cognito-identity/pull/644) chore(deps): bump ember-concurrency from 2.1.2 to 2.2.0 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.4.0 (2021-10-25)

#### :rocket: Enhancement
* [#631](https://github.com/fabscale/ember-cognito-identity/pull/631) feat: add `logoutForce` method to allow to handle inconsistent state ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#614](https://github.com/fabscale/ember-cognito-identity/pull/614) chore(deps-dev): bump ember-cli from 3.27.0 to 3.28.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#608](https://github.com/fabscale/ember-cognito-identity/pull/608) chore(deps): bump ember-auto-import from 2.1.0 to 2.2.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#615](https://github.com/fabscale/ember-cognito-identity/pull/615) chore(deps): bump amazon-cognito-identity-js from 5.0.6 to 5.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.3.0 (2021-08-20)

#### :house: Internal
* [#606](https://github.com/fabscale/ember-cognito-identity/pull/606) chore(deps): bump @ember/test-waiters from 2.4.5 to 3.0.0 ([@mydea](https://github.com/mydea))
* [#602](https://github.com/fabscale/ember-cognito-identity/pull/602) chore(deps): bump ember-auto-import from 2.0.2 to 2.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#598](https://github.com/fabscale/ember-cognito-identity/pull/598) chore(deps): bump @types/amazon-cognito-auth-js from 1.2.3 to 1.3.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#590](https://github.com/fabscale/ember-cognito-identity/pull/590) chore(deps): bump ember-concurrency from 2.1.0 to 2.1.2 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#577](https://github.com/fabscale/ember-cognito-identity/pull/577) chore(deps): bump amazon-cognito-identity-js from 5.0.3 to 5.0.6 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#580](https://github.com/fabscale/ember-cognito-identity/pull/580) chore(deps): bump @ember/test-waiters from 2.4.4 to 2.4.5 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#585](https://github.com/fabscale/ember-cognito-identity/pull/585) chore(deps): bump @embroider/macros from 0.43.0 to 0.43.3 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#587](https://github.com/fabscale/ember-cognito-identity/pull/587) chore(deps): bump @types/amazon-cognito-auth-js from 1.2.2 to 1.2.3 ([@dependabot[bot]](https://github.com/apps/dependabot))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.2.0 (2021-07-27)

## v3.1.1 (2021-07-22)

#### :bug: Bug Fix
* [#573](https://github.com/fabscale/ember-cognito-identity/pull/573) fix: Do not require userPoolId config to be set when mocks are enabled ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.1.0 (2021-07-22)

#### :rocket: Enhancement
* [#572](https://github.com/fabscale/ember-cognito-identity/pull/572) feat: Add `mockCognitoLogoutCurrentUser` test helper ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#571](https://github.com/fabscale/ember-cognito-identity/pull/571) Remove old mockCognito test helper ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.0.2 (2021-07-22)

#### :house: Internal
* [#570](https://github.com/fabscale/ember-cognito-identity/pull/570) chore(deps): bump @embroider/macros from 0.42.0 to 0.43.0 ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.0.1 (2021-07-05)

#### :bug: Bug Fix
* [#569](https://github.com/fabscale/ember-cognito-identity/pull/569) Fix default `enableMocks` config ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v3.0.0 (2021-07-01)

#### :rocket: Enhancement
* [#549](https://github.com/fabscale/ember-cognito-identity/pull/549) Refactor test helpers away from Pretender to mocked classes ([@mydea](https://github.com/mydea))

#### :bug: Bug Fix
* [#550](https://github.com/fabscale/ember-cognito-identity/pull/550) Ensure token is continuously refreshed, not just once ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#567](https://github.com/fabscale/ember-cognito-identity/pull/567) Update dev dependencies ([@mydea](https://github.com/mydea))
* [#554](https://github.com/fabscale/ember-cognito-identity/pull/554) chore(deps): bump ember-cli-typescript from 4.1.0 to 4.2.1 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#564](https://github.com/fabscale/ember-cognito-identity/pull/564) chore(deps): bump @embroider/macros from 0.42.1 to 0.42.3 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#565](https://github.com/fabscale/ember-cognito-identity/pull/565) chore(deps): bump ember-auto-import from 2.0.1 to 2.0.2 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#551](https://github.com/fabscale/ember-cognito-identity/pull/551) Fix typescript & eslint setup ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v2.4.0 (2021-06-29)

#### :rocket: Enhancement
* [#548](https://github.com/fabscale/ember-cognito-identity/pull/548) Expose `authenticateUser` method to check password ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#547](https://github.com/fabscale/ember-cognito-identity/pull/547) Export `mockCognitoData` test helper ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v2.3.0 (2021-06-23)

#### :rocket: Enhancement
* [#546](https://github.com/fabscale/ember-cognito-identity/pull/546) Allow to setup & use MFA authentication ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#545](https://github.com/fabscale/ember-cognito-identity/pull/545) Refactor cognito methods into util functions ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## v2.2.0 (2021-06-15)

#### :rocket: Enhancement
* [#544](https://github.com/fabscale/ember-cognito-identity/pull/544) Update default Pretender config for tests to pass through everything ([@mydea](https://github.com/mydea))

#### :house: Internal
* [#540](https://github.com/fabscale/ember-cognito-identity/pull/540) chore(deps): bump ember-concurrency from 2.0.3 to 2.1.0 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#537](https://github.com/fabscale/ember-cognito-identity/pull/537) chore(deps): bump amazon-cognito-identity-js from 4.6.3 to 5.0.3 ([@dependabot[bot]](https://github.com/apps/dependabot))
* [#536](https://github.com/fabscale/ember-cognito-identity/pull/536) chore: Update release-it config to use PRs ([@mydea](https://github.com/mydea))

#### Committers: 1
- Francesco Novy ([@mydea](https://github.com/mydea))

## [1.5.4](https://github.com/fabscale/ember-cognito-identity/compare/1.5.3...1.5.4) (2021-03-03)

## [1.5.3](https://github.com/fabscale/ember-cognito-identity/compare/1.5.2...1.5.3) (2021-02-18)

## [1.5.2](https://github.com/fabscale/ember-cognito-identity/compare/1.5.1...1.5.2) (2020-12-10)


### Bug Fixes

* Ensure `restoreAndLoad` properly throws CognitoNotAuthenticatedError ([79f0fea](https://github.com/fabscale/ember-cognito-identity/commit/79f0feaa1171d25d18f75dd24713c341975d33b6))

## [1.5.1](https://github.com/fabscale/ember-cognito-identity/compare/1.5.0...1.5.1) (2020-10-12)


### Bug Fixes

* Ensure restoreAndLoad rejects if not signed in ([ed0e99c](https://github.com/fabscale/ember-cognito-identity/commit/ed0e99c2f886185f4408ba46c7046691e162f835))

# [1.5.0](https://github.com/fabscale/ember-cognito-identity/compare/1.4.0...1.5.0) (2020-10-08)


### Features

* Ensure better type safety ([66b5550](https://github.com/fabscale/ember-cognito-identity/commit/66b5550a408327149756ca602a0b843e114982fb))

# [1.4.0](https://github.com/fabscale/ember-cognito-identity/compare/1.3.0...1.4.0) (2020-09-01)


### Features

* Allow to specify custom `endpoint` for user pool ([1b0fae3](https://github.com/fabscale/ember-cognito-identity/commit/1b0fae3e7fb1ea07881ad4fb4cf7381dc46211e3))

# [1.3.0](https://github.com/fabscale/ember-cognito-identity/compare/1.2.2...1.3.0) (2020-06-22)

## [1.2.2](https://github.com/fabscale/ember-cognito-identity/compare/1.2.1...1.2.2) (2020-06-09)

## [1.2.1](https://github.com/fabscale/ember-cognito-identity/compare/1.2.0...1.2.1) (2020-05-12)


### Bug Fixes

* Remove duplicate lib inclusion ([f5664b3](https://github.com/fabscale/ember-cognito-identity/commit/f5664b3597e2ca72038e4abf4a51e67e251d14fe))

# [1.2.0](https://github.com/fabscale/ember-cognito-identity/compare/1.1.0...1.2.0) (2020-04-15)


### Features

* Handle resetting password for inactive user ([e7f202b](https://github.com/fabscale/ember-cognito-identity/commit/e7f202b642c65a8d04f1ebd63a41de5643b87b79))

# [1.1.0](https://github.com/fabscale/ember-cognito-identity/compare/1.0.0...1.1.0) (2020-04-14)

# [1.0.0](https://github.com/fabscale/ember-cognito-identity/compare/0.11.0...1.0.0) (2020-04-07)


* chore!: Drop support for ember-source@3.13 ([e42fbcc](https://github.com/fabscale/ember-cognito-identity/commit/e42fbccec6b2652e26ed7a6dedefb9f983f864d2))


### Bug Fixes

* Ensure to use RSVPPromise everywhere ([0bc6a28](https://github.com/fabscale/ember-cognito-identity/commit/0bc6a28b5c6417b9e27880f78f76c33812babcd0))


### BREAKING CHANGES

* Changed support

# [0.11.0](https://github.com/fabscale/ember-cognito-identity/compare/0.10.2...0.11.0) (2020-02-25)


### Features

* Drop default components ([75c9cef](https://github.com/fabscale/ember-cognito-identity/commit/75c9cef0e950440a440dba49148f1cad6137484e))

## [0.10.2](https://github.com/fabscale/ember-cognito-identity/compare/0.10.1...0.10.2) (2020-02-06)


### Bug Fixes

* Ensure refresh access token task is cancelled when logging out ([0a58266](https://github.com/fabscale/ember-cognito-identity/commit/0a5826699a0dae9da6aeb5c73f7c6d7bb8353eed))

## [0.10.1](https://github.com/fabscale/ember-cognito-identity/compare/0.10.0...0.10.1) (2020-01-27)


### Bug Fixes

* Fix typescript setup ([1dd191a](https://github.com/fabscale/ember-cognito-identity/commit/1dd191a8034d935e2cf2f84510f5736296c54e26))

# [0.10.0](https://github.com/fabscale/ember-cognito-identity/compare/0.9.1...0.10.0) (2020-01-24)


### Features

* Add refreshAccessToken method to service ([bc46f79](https://github.com/fabscale/ember-cognito-identity/commit/bc46f792ec3ab3948b400935493aac5cc1ed89c2))
* Auto-refresh access tokens every 45 minutes ([44ef0cd](https://github.com/fabscale/ember-cognito-identity/commit/44ef0cdbc161f678ede95df71ae571bd065cd8b3))

## [0.9.1](https://github.com/fabscale/ember-cognito-identity/compare/0.9.0...0.9.1) (2020-01-21)

# [0.9.0](https://github.com/fabscale/ember-cognito-identity/compare/0.8.0...0.9.0) (2020-01-07)


### Bug Fixes

* fix template linting issues ([1e3c9e8](https://github.com/fabscale/ember-cognito-identity/commit/1e3c9e85d9f77f2a93e7cbd9c6091da3f7ef1ee3))


### Features

* Throw InvalidPasswordError for InvalidParameterException ([5caea05](https://github.com/fabscale/ember-cognito-identity/commit/5caea05affbd1588e50038c1c33ce485bcc05252))

# [0.8.0](https://github.com/fabscale/ember-cognito-identity/compare/0.6.0...0.8.0) (2019-12-04)


### Bug Fixes

* Remove isDevelopingAddon hook to speed up host app builds ([9245903](https://github.com/fabscale/ember-cognito-identity/commit/9245903a0de36c84e0fbf147d83a7c96e89a6890))


### Features

* Add typing for all components ([8918b27](https://github.com/fabscale/ember-cognito-identity/commit/8918b270ebb38158c84a53346697f0843df1b4b9))
* Add typing for cognito service ([1504d84](https://github.com/fabscale/ember-cognito-identity/commit/1504d84dcd0ffb72be61c487e9147b53a4f1fcba))
* Add typing for errors/cognito ([701dad3](https://github.com/fabscale/ember-cognito-identity/commit/701dad334e5ee3e364c07ead29a0dc3c08790b26))
* Add typing for global-polyfill ([04d0b71](https://github.com/fabscale/ember-cognito-identity/commit/04d0b71cea86382f81f62e1237cd9ee22a5e9b94))
* Do not pass in `cognitoData` to `onAuthenticated` hook ([f79156b](https://github.com/fabscale/ember-cognito-identity/commit/f79156bed4e4657ed0dfafcfdd662c9a6328e574))

# [0.7.0](https://github.com/fabscale/ember-cognito-identity/compare/0.6.0...0.7.0) (2019-11-12)


### Bug Fixes

* Remove isDevelopingAddon hook to speed up host app builds ([9245903](https://github.com/fabscale/ember-cognito-identity/commit/9245903))


### Features

* Add typing for all components ([8918b27](https://github.com/fabscale/ember-cognito-identity/commit/8918b27))
* Add typing for cognito service ([1504d84](https://github.com/fabscale/ember-cognito-identity/commit/1504d84))
* Add typing for errors/cognito ([701dad3](https://github.com/fabscale/ember-cognito-identity/commit/701dad3))
* Add typing for global-polyfill ([04d0b71](https://github.com/fabscale/ember-cognito-identity/commit/04d0b71))
* Do not pass in `cognitoData` to `onAuthenticated` hook ([f79156b](https://github.com/fabscale/ember-cognito-identity/commit/f79156b))

# [0.6.0](https://github.com/fabscale/ember-cognito-identity/compare/0.5.0...0.6.0) (2019-10-23)


### Bug Fixes

* Remove unneeded file ([92fc81a](https://github.com/fabscale/ember-cognito-identity/commit/92fc81a))


### Features

* Import amazon-cognito-identity-js instead of using global ([b305ba6](https://github.com/fabscale/ember-cognito-identity/commit/b305ba6))

# [0.5.0](https://github.com/fabscale/ember-cognito-identity/compare/0.4.1...0.5.0) (2019-10-14)


### Features

* Use [@tracked](https://github.com/tracked)() instead of computed() ([b9e646c](https://github.com/fabscale/ember-cognito-identity/commit/b9e646c))
* Use @glimmer/component instead of @ember/component ([e2aae2a](https://github.com/fabscale/ember-cognito-identity/commit/e2aae2a))
* Use co-location component setup (requires ember-source>3.13!) ([3b33552](https://github.com/fabscale/ember-cognito-identity/commit/3b33552))

## [0.4.1](https://github.com/fabscale/ember-cognito-identity/compare/0.4.0...0.4.1) (2019-10-14)

# [0.4.0](https://github.com/fabscale/ember-cognito-identity/compare/0.3.0...0.4.0) (2019-09-13)


### Features

* Allow to customize new attributes for setNewPassword ([81eac69](https://github.com/fabscale/ember-cognito-identity/commit/81eac69))

# [0.3.0](https://github.com/fabscale/ember-cognito-identity/compare/0.2.5...0.3.0) (2019-08-29)


### Features

* Ensure pretender is not included in production builds ([6841f58](https://github.com/fabscale/ember-cognito-identity/commit/6841f58))

## [0.2.5](https://github.com/fabscale/ember-cognito-identity/compare/0.2.4...0.2.5) (2019-08-28)


### Bug Fixes

* Ensure restoreAndLoad does nothing if session is already loaded ([0af1fac](https://github.com/fabscale/ember-cognito-identity/commit/0af1fac))

## [0.2.4](https://github.com/fabscale/ember-cognito-identity/compare/0.2.3...0.2.4) (2019-08-22)


### Bug Fixes

* Use set for setup-cognito-mocks test helper ([83ed015](https://github.com/fabscale/ember-cognito-identity/commit/83ed015))

## [0.2.3](https://github.com/fabscale/ember-cognito-identity/compare/0.2.2...0.2.3) (2019-08-19)

## [0.2.2](https://github.com/fabscale/ember-cognito-identity/compare/0.2.1...0.2.2) (2019-08-19)


### Bug Fixes

* Update module import paths for new package name ([5a0dfbb](https://github.com/fabscale/ember-cognito-identity/commit/5a0dfbb))

## [0.2.1](https://github.com/fabscale/ember-cognito-identity/compare/0.2.0...0.2.1) (2019-08-19)

# [0.2.0](https://github.com/fabscale/ember-cognito-identity/compare/0.1.1...0.2.0) (2019-08-12)


### Features

* convert all classes to native ES6 class syntax ([2299eb1](https://github.com/fabscale/ember-cognito-identity/commit/2299eb1))

## [0.1.1](https://github.com/fabscale/ember-cognito-identity/compare/0.1.0...0.1.1) (2019-08-12)



# 0.1.0 (2019-08-12)

