import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import setup from './setup_test';
import RxStore from './RxStore';
import { getComponentName } from './utils';

beforeAll(setup);

describe('RxStore constructor connect', () => {
  test('should initialize a new store', () => {
    let store = new RxStore();
    expect(store instanceof RxStore).toBe(true);
  });

  test('should initialize with correct namespace and {} initial state', () => {
    let ns = 'Users';
    let store = new RxStore({ ns });
    expect(store.namespace).toBe(ns);
    expect(store.state).toEqual({});
  });

  test('should intialize with initialState and namespace', () => {
    let ns = 'Users';
    let initialState = {
      users: [{ name: 'jhon' }],
    };
    let store = new RxStore({ ns, initialState });
    expect(store.state).toBe(initialState);
    expect(store.namespace).toBe(ns);
  });

  test('should connect a functional component and get rxConnected(...) name', () => {
    let ns = 'Users';
    let store = new RxStore({ ns });

    let Dumb = () => <div />;
    let connectedDumb = store.connect((state) => state)(Dumb);
    expect(connectedDumb.displayName).toBe(
      `[${ns}]rxConnected(${getComponentName(Dumb)})`,
    );
  });

  test('should connect a component and get rxConnected(...) name', () => {
    let ns = 'Users';
    let store = new RxStore({ ns });

    class Dumb extends React.Component {
      render() {
        return <h1>Hello, {this.props.name}</h1>;
      }
    }

    let connectedDumb = store.connect((state) => state)(Dumb);
    expect(connectedDumb.displayName).toBe(
      `[${ns}]rxConnected(${getComponentName(Dumb)})`,
    );
  });
});

describe('RxStore dispatch', () => {
  test('should change the state of connected comp after a dispatch', async () => {
    let ns = 'Users';
    let initialState = {
      users: [],
    };
    let store = new RxStore({ ns, initialState });
    let Dumb = (props) => <div />;
    let mapStateToProps = (state) => ({
      users: state.users,
      title: 'Props added in the fly',
    });
    let ConnectedDumb = store.connect(mapStateToProps)(Dumb);
    let wrapper = shallow(<ConnectedDumb />);

    expect(wrapper.props()).toEqual({
      users: [],
      title: 'Props added in the fly',
    });

    expect(wrapper.state()).toEqual(store.state);

    await store.dispatch((state) => ({
      ...state,
      users: state.users.concat('Skywalker'),
    }));

    expect(wrapper.state()).toEqual({
      ...store.state,
      users: ['Skywalker'],
    });
  });

  test('should call all hooks middlewares  with a dispatch', async () => {
    let hooks = [
      'BeforeGlobalParalel', // Promise.all
      'BeforeLocalParalel', // Promise.all
      'BeforeGlobalSequential', // for in
      'BeforeLocalSequential', // for in
      'AfterGlobalParalel',
      'AfterLocalParalel',
      'AfterGlobalSequential',
      'AfterLocalSequential',
    ];
    let ns = 'Users';
    let initialState = {
      users: [],
    };
    let store = new RxStore({ ns, initialState });

    let callstack = [];
    let spiedHooks = hooks.map((h) =>
      sinon.stub().callsFake(() => callstack.push(h)),
    );
    hooks.forEach((h, i) => store[h].set(i, spiedHooks[i]));
    await store.dispatch((state) => state);
    expect(callstack).toEqual(hooks);
    spiedHooks.forEach((spy) => expect(spy.calledOnce).toBe(true));
    spiedHooks.forEach((spy) =>
      expect(spy.firstCall.args[0]).toEqual(store.state),
    ); // as the state doesnt be changed
  });
});
