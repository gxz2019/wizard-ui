import React from 'react';
import { storiesOf } from '@storybook/react';
import { Breadcrumb, BreadcrumbItem } from '../src';

storiesOf('Panel', module)
  .add('basic', () => (
    <Breadcrumb>
      <BreadcrumbItem href="#">资源列表1</BreadcrumbItem>
      <BreadcrumbItem href="#">资源列表2</BreadcrumbItem>
    </Breadcrumb>
  ))