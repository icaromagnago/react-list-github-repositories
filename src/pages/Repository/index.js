/* eslint-disable react/static-property-placement */
/* eslint-disable react/state-in-constructor */
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaAngleRight, FaAngleLeft } from 'react-icons/fa';

import api from '../../services/api';

import Container from '../../components/Container';

import {
  Loading,
  Owner,
  IssueList,
  IssueFilter,
  IssueButton,
  Pagination,
} from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    page: 1,
    filterOptions: [
      { state: 'all', text: 'All', checked: false },
      { state: 'open', text: 'Open', checked: true },
      { state: 'closed', text: 'Closed', checked: false },
    ],
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filterOptions, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`repos/${repoName}`),
      api.get(`repos/${repoName}/issues`, {
        params: {
          state: filterOptions.find(f => f.checked).state,
          per_page: 5,
          page,
        },
      }),
    ]);

    console.log(issues);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  loadIssues = async () => {
    const { filterOptions, page } = this.state;
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const issues = await api.get(`repos/${repoName}/issues`, {
      params: {
        state: filterOptions.find(f => f.checked).state,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: issues.data,
    });
  };

  handleClick = async e => {
    const { filterOptions } = this.state;

    filterOptions.find(f => f.checked).checked = false;
    filterOptions.find(f => f.state === e.target.value).checked = true;

    this.setState({
      filterOptions,
    });

    await this.loadIssues();
  };

  handlePagination = async action => {
    const { page } = this.state;
    await this.setState({
      page: action === 'back' ? page - 1 : page + 1,
    });

    this.loadIssues();
  };

  render() {
    const { repository, issues, loading, filterOptions, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueFilter>
          {filterOptions.map(fo => (
            <IssueButton
              key={fo.state}
              checked={fo.checked}
              value={fo.state}
              onClick={this.handleClick}
            >
              {fo.text}
            </IssueButton>
          ))}
        </IssueFilter>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}>{issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>
        <Pagination>
          <button
            type="button"
            disabled={page < 2}
            onClick={() => this.handlePagination('back')}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button type="button" onClick={() => this.handlePagination('next')}>
            Próximo
          </button>
        </Pagination>
      </Container>
    );
  }
}
