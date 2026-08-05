using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using PriscilaSkincare.Application.Authentication;
using PriscilaSkincare.Application.Customers;
using PriscilaSkincare.Application.Reviews;
using PriscilaSkincare.Application.Orders;

namespace PriscilaSkincare.Api.Security;

public sealed class ApiExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title, code) = exception switch
        {
            AuthenticationException authenticationException =>
                (StatusCodes.Status400BadRequest, authenticationException.Message, authenticationException.Code),
            AddressException addressException when addressException.Code.EndsWith("not_found") =>
                (StatusCodes.Status404NotFound, addressException.Message, addressException.Code),
            AddressException addressException =>
                (StatusCodes.Status400BadRequest, addressException.Message, addressException.Code),
            ReviewException reviewException when reviewException.Code.EndsWith("not_found") =>
                (StatusCodes.Status404NotFound, reviewException.Message, reviewException.Code),
            ReviewException reviewException =>
                (StatusCodes.Status400BadRequest, reviewException.Message, reviewException.Code),
            CommerceException commerceException when commerceException.Code.EndsWith("not_found") =>
                (StatusCodes.Status404NotFound, commerceException.Message, commerceException.Code),
            CommerceException commerceException =>
                (StatusCodes.Status400BadRequest, commerceException.Message, commerceException.Code),
            ArgumentException argumentException =>
                (StatusCodes.Status400BadRequest, argumentException.Message, "validation_error"),
            _ =>
                (StatusCodes.Status500InternalServerError, "Não foi possível concluir o pedido.", "internal_error")
        };

        if (status >= 500)
        {
            logger.LogError(exception, "Erro não tratado ao processar {Path}", httpContext.Request.Path);
        }

        httpContext.Response.StatusCode = status;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = status,
                Title = title,
                Extensions = { ["code"] = code }
            },
            Exception = exception
        });
    }
}
