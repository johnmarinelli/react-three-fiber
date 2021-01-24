import React, { Suspense } from 'react'
import styled from 'styled-components'
import { Link, Route, Switch, useRouteMatch, useLocation } from 'react-router-dom'
import * as demos from '../demos'
import { Page as PageImpl } from '../styles'
import { Bug } from '../demos/dev/Bug'

const defaultComponent = 'Bug191'
const visibleComponents = Object.entries(demos)
  //.filter(([name, item]) => !item.dev)
  .reduce((acc, [name, item]) => ({ ...acc, [name]: item }), {})

export default function Intro() {
  return (
    <div>
      <Bug />
    </div>
  )
}

function Demos() {
  const location = useLocation()
  const match = useRouteMatch('/demo/:name')
  const dev = React.useMemo(() => new URLSearchParams(location.search).get('dev'), [location.search])
  const { bright } = visibleComponents[match ? match.params.name : defaultComponent]
  return (
    <DemoPanel>
      {Object.entries(visibleComponents).map(function mapper([name, item]) {
        const style = {
          // to complex to optimize
          background:
            (!match && name === defaultComponent) || (match && match.params.name === name)
              ? 'salmon'
              : bright
              ? '#2c2d31'
              : 'white',
        }
        return dev ? null : (
          <Link key={name} to={`/demo/${name}`}>
            <Spot style={style} />
          </Link>
        )
      })}
    </DemoPanel>
  )
}

const Page = styled(PageImpl)`
  padding: 20px;

  & > h1 {
    position: absolute;
    top: 70px;
    left: 60px;
  }

  & > a {
    position: absolute;
    bottom: 60px;
    right: 60px;
    font-size: 1.2em;
  }
`

const DemoPanel = styled.div`
  position: absolute;
  bottom: 50px;
  left: 50px;
  max-width: 250px;
`

const Spot = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin: 8px;
`
