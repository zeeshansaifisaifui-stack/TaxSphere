    (function () {
      var selectedRating = 0;

      var openBtn = document.getElementById('openReviewForm');
      var formWrap = document.getElementById('reviewFormWrap');
      var starBox = document.getElementById('starRating');
      var submitBtn = document.getElementById('submitReview');
      var cancelBtn = document.getElementById('cancelReview');
      var grid = document.getElementById('reviewsGrid');
      var noMsg = document.getElementById('noReviewMsg');
      var nameInput = document.getElementById('reviewName');
      var textInput = document.getElementById('reviewText');
      var statusMsg = document.getElementById('reviewStatusMsg');

      function showStatus(message, type) {
        if (!statusMsg) return;
        statusMsg.textContent = message;
        statusMsg.style.display = 'block';
        statusMsg.style.color = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#666';
        statusMsg.style.padding = '10px';
        statusMsg.style.marginTop = '10px';
        statusMsg.style.borderRadius = '8px';
        statusMsg.style.background = type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#f8f9fa';
        setTimeout(function() {
          statusMsg.style.display = 'none';
        }, 5000);
      }

      function renderCard(r) {
        var card = document.createElement('div');
        card.style.cssText = 'background:var(--white);border-radius:16px;padding:16px;box-shadow:var(--shadow-card)';

        var rating = Number(r.rating) || 0;
        var starLine = '';
        for (var i = 1; i <= 5; i++) { starLine += i <= rating ? '★' : '☆'; }

        var stars = document.createElement('div');
        stars.style.cssText = 'color:var(--bronze);font-size:18px;letter-spacing:2px;margin-bottom:8px';
        stars.textContent = starLine;

        var body = document.createElement('p');
        body.style.cssText = 'margin:0 0 8px;white-space:pre-wrap';
        body.textContent = r.review_text || r.text;

        var meta = document.createElement('p');
        meta.style.cssText = 'margin:0;font-size:13px;opacity:0.7';
        var date = r.created_at || r.date;
        meta.textContent = r.name + ' · ' + (date ? new Date(date).toLocaleDateString() : '');

        card.appendChild(stars);
        card.appendChild(body);
        card.appendChild(meta);
        return card;
      }

      async function loadReviews() {
        try {
          if (statusMsg) {
            statusMsg.textContent = 'Loading reviews...';
            statusMsg.style.display = 'block';
            statusMsg.style.color = '#666';
            statusMsg.style.background = '#f8f9fa';
          }
          const response = await fetch('/api/reviews');
          if (!response.ok) {
            throw new Error('Failed to load');
          }
          const data = await response.json();
          var list = data.reviews || [];
          
          if (statusMsg) statusMsg.style.display = 'none';
          
          grid.innerHTML = '';
          if (!list.length) {
            noMsg.hidden = false;
            return;
          }
          noMsg.hidden = true;
          list.forEach(function (r) { grid.appendChild(renderCard(r)); });
        } catch (e) {
          if (statusMsg) {
            statusMsg.textContent = 'Failed to load reviews';
            statusMsg.style.display = 'block';
            statusMsg.style.color = '#dc3545';
            statusMsg.style.background = '#f8d7da';
          }
          noMsg.hidden = false;
        }
      }

      function paintStars() {
        Array.prototype.forEach.call(starBox.querySelectorAll('span'), function (sp) {
          sp.classList.toggle('active', Number(sp.getAttribute('data-star')) <= selectedRating);
        });
      }

      if (openBtn) {
        openBtn.addEventListener('click', function () { 
          formWrap.style.display = 'block'; 
          if (statusMsg) statusMsg.style.display = 'none';
        });
      }
      if (cancelBtn) {
        cancelBtn.addEventListener('click', function () { 
          formWrap.style.display = 'none'; 
          if (statusMsg) statusMsg.style.display = 'none';
        });
      }
      if (starBox) {
        starBox.addEventListener('click', function (e) {
          var el = e.target;
          if (!el || !el.getAttribute('data-star')) { return; }
          selectedRating = Number(el.getAttribute('data-star'));
          paintStars();
        });
      }
      if (submitBtn) {
        submitBtn.addEventListener('click', async function () {
          var name = nameInput.value.trim();
          var text = textInput.value.trim();
          
          if (!name || name.length < 2) {
            showStatus('Please enter a valid name (at least 2 characters).', 'error');
            nameInput.focus();
            return;
          }
          if (name.length > 80) {
            showStatus('Name must be 80 characters or less.', 'error');
            nameInput.focus();
            return;
          }
          if (!selectedRating || selectedRating < 1 || selectedRating > 5) {
            showStatus('Please select a rating.', 'error');
            return;
          }
          if (!text) {
            showStatus('Please enter your review.', 'error');
            textInput.focus();
            return;
          }
          if (text.trim().length === 0) {
            showStatus('Review cannot be empty or whitespace-only.', 'error');
            textInput.focus();
            return;
          }

          submitBtn.disabled = true;
          submitBtn.textContent = 'Submitting...';
          showStatus('Submitting your review...', 'info');

          try {
            const response = await fetch('/api/reviews', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: name,
                rating: selectedRating,
                reviewText: text
              })
            });

            const data = await response.json();

            if (response.ok) {
              showStatus(data.message || 'Review submitted successfully! It will be visible after admin approval.', 'success');
              nameInput.value = '';
              textInput.value = '';
              selectedRating = 0;
              paintStars();
              formWrap.style.display = 'none';
              loadReviews();
            } else {
              showStatus(data.error || 'Failed to submit review. Please try again.', 'error');
            }
          } catch (e) {
            showStatus('Network error. Please check your connection and try again.', 'error');
          } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
          }
        });
      }

      loadReviews();
    })();
