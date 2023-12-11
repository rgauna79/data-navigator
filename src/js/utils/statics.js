// import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap/dist/js/bootstrap.bundle.min.js';

function showHeadersOptions() {
    const headerOptionsModal = new bootstrap.Modal(document.getElementById('headerOptionsModal'), {
        backdrop: 'static',
        keyboard: false
    });
    headerOptionsModal.show();

    //Get table header
    const headers = Array.from(document.querySelectorAll('#dataSection table th')).map(th => th.textContent);
    
    const modalBody = document.getElementById('headerOptionsModalBody');
    modalBody.innerHTML = '';

    headers.forEach(header => {
        const label = document.createElement('label');
        label.classList.add('form-check-label');
        label.textContent = header;

        const checkbox = document.createElement('input');
        checkbox.classList.add('form-check-input');
        checkbox.type = 'checkbox';
        checkbox.value = header;

        const select = document.createElement('select');
        select.classList.add('form-select');
        select.innerHTML = `
            <option value="group">Group</option>
            <option value="top5">Top 5</option>
            <option value="total">Total</option>
        `;

        modalBody.appendChild(checkbox);
        modalBody.appendChild(label);
        modalBody.appendChild(select);
        modalBody.appendChild(document.createElement('br'));

    })
    
    const showResultsBtn = document.createElement('button');
    showResultsBtn.classList.add('btn' , 'btn-primary');
    showResultsBtn.textContent = 'Show Results';
    showResultsBtn.addEventListener('click', function (){

    });

    modalBody.appendChild(showResultsBtn);

}


export { showHeadersOptions };