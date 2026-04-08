const translateBtn = document.getElementById('translateBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const input = document.getElementById('input');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copyBtn');
const errorMsg = document.getElementById('errorMsg');

translateBtn.addEventListener('click', async () => {
  const text = input.value.trim();

  if (!text) {
    showError('Escreva algo no campo de texto antes de traduzir.');
    return;
  }

  setLoading(true);
  hideError();
  output.value = '';
  copyBtn.classList.add('hidden');

  try {
    const response = await fetch('/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Erro ao traduzir. Tente novamente.');
      return;
    }

    output.value = data.result;
    copyBtn.classList.remove('hidden');
  } catch {
    showError('Erro de conexão com o servidor.');
  } finally {
    setLoading(false);
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(output.value).then(() => {
    const original = copyBtn.textContent;
    copyBtn.textContent = 'Copiado!';
    setTimeout(() => (copyBtn.textContent = original), 2000);
  });
});

function setLoading(state) {
  translateBtn.disabled = state;
  btnText.textContent = state ? 'Traduzindo...' : 'Traduzir';
  btnSpinner.classList.toggle('hidden', !state);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove('hidden');
}

function hideError() {
  errorMsg.classList.add('hidden');
}
