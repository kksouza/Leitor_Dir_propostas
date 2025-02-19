document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('csvFile');
  const outputDiv = document.getElementById('output');

  fileInput.addEventListener('change', async (event) => {
    outputDiv.innerHTML = '<p>Processando arquivo...</p>';
    const file = event.target.files[0];
    if (!file) {
      outputDiv.innerHTML = '<p>Nenhum arquivo selecionado.</p>';
      return;
    }

    try {
      const text = await file.text('ISO-8859-1'); // Assuming ISO-8859-1 encoding
      const lines = text.split('\n');
      const filteredData = processData(lines);
      if (filteredData && filteredData.length > 0) {
        renderTable(filteredData, outputDiv);
        renderClientChart(filteredData);
        renderEvolutionChart(filteredData);
        renderTagsChart(filteredData);
        renderVersionsChart(filteredData);
        renderDirectoriesChart(filteredData);
      } else {
        outputDiv.innerHTML = '<p>Nenhum arquivo .doc.pdf válido encontrado.</p>';
        clearCharts();
      }
    } catch (error) {
      console.error('Erro ao processar o arquivo:', error);
      outputDiv.innerHTML = '<p>Erro ao processar o arquivo CSV.</p>';
      clearCharts();
    }
  });
});

function processData(lines) {
  const validFiles = [];
  const pattern = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+\((.+?)\)\s+P#(\d+\.\d{4})\s+v(\d+)(?:_(.+))?\.doc\.pdf/;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.endsWith('.doc.pdf')) {
      const fullPath = trimmedLine;
      const pathParts = fullPath.split(/[\\/]/).filter(part => part); // Split by both \ and / and filter empty parts
      const filename = pathParts.pop(); // Filename is the last part
      const directory = pathParts.length > 0 ? pathParts.pop() : ''; // Directory is the second to last part, if exists
      const rootDirectory = pathParts.join('\\'); // Root directory is everything before the directory

      const match = filename.match(pattern);

      if (match) {
        const [fullMatch, date, client, tags, proposalCode, version, description] = match;
        const formattedDate = formatDate(date);
        validFiles.push({
          rootDirectory: rootDirectory.trim(),
          directory: directory.trim(),
          filename: filename.trim(),
          fullPath: fullPath.trim(),
          date: formattedDate,
          client: client.trim(),
          tags: tags.split('+').map(tag => tag.trim()),
          proposalCode: proposalCode.trim(),
          version: parseInt(version, 10),
          description: description ? description.replace(/_/g, ' ').trim() : ''
        });
      }
    }
  }
  return validFiles;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

function renderTable(data, outputDiv) {
  let tableHTML = '<table>';
  tableHTML += '<thead><tr><th>Diretório Raiz</th><th>Diretório</th><th>Nome do Arquivo</th><th>Data</th><th>Cliente</th><th>Tags</th><th>Código da Proposta</th><th>Versão</th><th>Descrição</th></tr></thead>';
  tableHTML += '<tbody>';

  data.forEach(item => {
    tableHTML += `
      <tr>
        <td>${item.rootDirectory}</td>
        <td>${item.directory}</td>
        <td>${item.filename}</td>
        <td>${item.date}</td>
        <td>${item.client}</td>
        <td>${item.tags.join(', ')}</td>
        <td>${item.proposalCode}</td>
        <td>${item.version}</td>
        <td>${item.description}</td>
      </tr>
    `;
  });

  tableHTML += '</tbody></table>';
  outputDiv.innerHTML = tableHTML;
}

function renderClientChart(data) {
  const clientCounts = {};
  data.forEach(item => {
    clientCounts[item.client] = (clientCounts[item.client] || 0) + 1;
  });

  const clients = Object.keys(clientCounts);
  const counts = Object.values(clientCounts);

  const ctx = document.getElementById('clientChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: clients,
      datasets: [{
        label: 'Número de Documentos',
        data: counts,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de Documentos'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Cliente'
          }
        }
      },
      plugins: {
        title: {
          display: false,
          text: 'Distribuição de Documentos por Cliente'
        },
        legend: {
          display: false
        }
      }
    }
  });
}

function renderEvolutionChart(data) {
  const yearCounts = {};
  data.forEach(item => {
    const year = item.date.split('/')[2];
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });

  const years = Object.keys(yearCounts).sort();
  const counts = years.map(year => yearCounts[year]);

  const ctx = document.getElementById('evolutionChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [{
        label: 'Número de Propostas',
        data: counts,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de Propostas'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Ano'
          }
        }
      },
      plugins: {
        title: {
          display: false,
          text: 'Evolução das Propostas ao Longo do Tempo'
        },
        legend: {
          display: false
        }
      }
    }
  });
}

function renderTagsChart(data) {
  const tagCounts = {};
  data.forEach(item => {
    item.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tags = Object.keys(tagCounts);
  const counts = Object.values(tagCounts);

  const ctx = document.getElementById('tagsChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: tags,
      datasets: [{
        label: 'Frequência de Tags',
        data: counts,
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: 'rgba(255, 255, 255, 1)',
        borderWidth: 1
      }]
    },
    options: {
      plugins: {
        title: {
          display: false,
          text: 'Categorias (Tags) Mais Frequentes'
        },
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function renderVersionsChart(data) {
  const versionCounts = {};
  data.forEach(item => {
    versionCounts[item.version] = (versionCounts[item.version] || 0) + 1;
  });

  const versions = Object.keys(versionCounts).sort((a, b) => parseInt(a) - parseInt(b));
  const counts = versions.map(version => versionCounts[version]);

  const ctx = document.getElementById('versionsChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: versions,
      datasets: [{
        label: 'Número de Documentos',
        data: counts,
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de Documentos'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Versão'
          }
        }
      },
      plugins: {
        title: {
          display: false,
          text: 'Distribuição das Versões dos Documentos'
        },
        legend: {
          display: false
        }
      }
    }
  });
}

function renderDirectoriesChart(data) {
  const directoryCounts = {};
  data.forEach(item => {
    directoryCounts[item.directory] = (directoryCounts[item.directory] || 0) + 1;
  });

  const directories = Object.keys(directoryCounts);
  const counts = Object.values(directoryCounts);

  const ctx = document.getElementById('directoriesChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: directories,
      datasets: [{
        label: 'Número de Documentos',
        data: counts,
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Número de Documentos'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Diretório'
          }
        }
      },
      plugins: {
        title: {
          display: false,
          text: 'Volume de Documentos por Diretório'
        },
        legend: {
          display: false
        }
      }
    }
  });
}

function clearCharts() {
  const chartIds = ['clientChart', 'evolutionChart', 'tagsChart', 'versionsChart', 'directoriesChart'];
  chartIds.forEach(id => {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });
}