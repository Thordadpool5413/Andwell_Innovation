'use client';

import React from 'react';
import { Badge } from '../Shared';
import { andwellCatalog } from '../../../lib/andwell';

export function Catalog() {
  return <><section className="section"><div><h1>Andwell Catalog</h1><p>Approved baseline service catalog with subservice capability depth and safe positioning guidance.</p></div></section><div className="grid cols2">{andwellCatalog.map((service) => <div className="catalogCard" key={service.serviceLine}><Badge>{service.category}</Badge><h3>{service.serviceLine}</h3><p>{service.description}</p><div className="tagCloud">{service.subservices.slice(0, 18).map((item) => <span key={item}>{item}</span>)}{service.subservices.length > 18 ? <span>More {service.subservices.length - 18}</span> : null}</div><div className="notice"><strong>Safe language</strong><br />{service.safeLanguage}</div><div className="error"><strong>Avoid saying</strong><br />{service.avoid}</div></div>)}</div></>;
}
